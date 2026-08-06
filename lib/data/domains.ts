import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeDomain } from '@/lib/domain-verification/normalize';
import { createVerificationToken, toTxtRecordValue } from '@/lib/domain-verification/token';
import { DomainError, DomainErrorCode } from '@/lib/errors';
import type { Tables } from '@/lib/database.types';

export type Domain = Tables<'domains'>;
export type Verification = Tables<'verifications'>;

/** Domain row plus current verification TXT value and latest check note. */
export type DomainListItem = Domain & {
  failureReason: string | null;
  txtRecord: string | null;
};

export type AddDomainResult = {
  domain: Domain;
  verification: Verification;
  /** Plaintext TXT record value to publish. */
  txtRecord: string;
};

async function requireUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    throw new DomainError(DomainErrorCode.UNAUTHORIZED);
  }

  return { supabase, userId: data.claims.sub as string };
}

/**
 * Ensure the current user owns the given domain before privileged operations
 * (e.g. DNS verify via admin client).
 */
export async function assertUserOwnsDomain(domainId: string): Promise<void> {
  const { supabase, userId } = await requireUserId();

  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('id', domainId)
    .eq('user_id', userId)
    .maybeSingle();

  if (domainError) {
    throw new Error(domainError.message);
  }

  if (!domain) {
    throw new DomainError(DomainErrorCode.DOMAIN_NOT_FOUND);
  }
}

type DomainRowWithVerification = Domain & {
  current_verification:
    | { failure_reason: string | null; token: string }
    | { failure_reason: string | null; token: string }[]
    | null;
};

/**
 * Get all domains for the current user
 */
export async function getDomains(): Promise<DomainListItem[]> {
  const { supabase } = await requireUserId();

  const { data, error } = await supabase
    .from('domains')
    .select(
      '*, current_verification:verifications!domains_current_verification_id_fkey(failure_reason, token)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DomainRowWithVerification[]).map((row) => {
    const { current_verification, ...domain } = row;
    const verification = Array.isArray(current_verification)
      ? (current_verification[0] ?? null)
      : current_verification;

    return {
      ...domain,
      failureReason: verification?.failure_reason ?? null,
      txtRecord: verification?.token ? toTxtRecordValue(verification.token) : null,
    };
  });
}

const VERIFICATION_SELECT =
  'id, domain_id, token, status, failure_reason, last_checked_at, status_changed_at, created_at, updated_at';

async function createPendingVerification(domainId: string) {
  const token = createVerificationToken();
  const txtRecord = toTxtRecordValue(token);
  const admin = createAdminClient();

  const { data: verification, error: verificationError } = await admin
    .from('verifications')
    .insert({
      domain_id: domainId,
      token,
      status: 'pending',
    })
    .select(VERIFICATION_SELECT)
    .single();

  if (verificationError) {
    throw new Error(verificationError.message);
  }

  return { verification, txtRecord };
}

/**
 * Add a new domain to the user's account
 */
export async function addDomain(rawDomain: string): Promise<AddDomainResult> {
  const { supabase, userId } = await requireUserId();
  const domainName = normalizeDomain(rawDomain);

  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .insert({
      user_id: userId,
      domain: domainName,
      status: 'pending',
    })
    .select('*')
    .single();

  if (domainError) {
    if (domainError.code === '23505') {
      throw new DomainError(DomainErrorCode.DOMAIN_ALREADY_ADDED);
    }
    throw new Error(domainError.message);
  }

  const { verification, txtRecord } = await createPendingVerification(domain.id);

  const { data: updatedDomain, error: updateError } = await supabase
    .from('domains')
    .update({ current_verification_id: verification.id })
    .eq('id', domain.id)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    domain: updatedDomain,
    verification,
    txtRecord,
  };
}

/**
 * Issue a new TXT token for an existing domain
 */
export async function regenerateVerification(domainId: string): Promise<AddDomainResult> {
  const { supabase } = await requireUserId();

  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('id', domainId)
    .maybeSingle();

  if (domainError) {
    throw new Error(domainError.message);
  }

  if (!domain) {
    throw new DomainError(DomainErrorCode.DOMAIN_NOT_FOUND);
  }

  const { verification, txtRecord } = await createPendingVerification(domain.id);

  const { data: updatedDomain, error: updateError } = await supabase
    .from('domains')
    .update({
      current_verification_id: verification.id,
      status: 'pending',
      claimed_at: null,
    })
    .eq('id', domain.id)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    domain: updatedDomain,
    verification,
    txtRecord,
  };
}

/**
 * Remove a domain owned by the current user
 */
export async function deleteDomain(domainId: string): Promise<void> {
  const { supabase } = await requireUserId();

  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .select('id')
    .eq('id', domainId)
    .maybeSingle();

  if (domainError) {
    throw new Error(domainError.message);
  }

  if (!domain) {
    throw new DomainError(DomainErrorCode.DOMAIN_NOT_FOUND);
  }

  const { error: clearError } = await supabase
    .from('domains')
    .update({ current_verification_id: null })
    .eq('id', domainId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: deleteError } = await supabase.from('domains').delete().eq('id', domainId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
