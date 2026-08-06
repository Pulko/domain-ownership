import { Resolver } from 'node:dns/promises';
import { timingSafeEqual } from 'node:crypto';

import { createAdminClient } from '@/lib/supabase/admin';
import { toTxtRecordValue, TXT_PREFIX } from '@/lib/domain-verification/token';
import { DomainError, DomainErrorCode } from '@/lib/errors';

export type CheckOutcome = 'claimed' | 'rejected' | 'failed';

export type CheckResult = {
  verificationId: string;
  domainId: string;
  domain: string;
  outcome: CheckOutcome;
  failureReason: string | null;
};

function recordsToStrings(records: string[][]): string[] {
  return records.map((chunks) => chunks.join(''));
}

function txtValuesMatch(expected: string, candidate: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(candidate, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function lookupTxtOutcome(
  domain: string,
  token: string
): Promise<{ outcome: CheckOutcome; failureReason: string | null }> {
  const expected = toTxtRecordValue(token);

  console.info('[domain-verify] DNS TXT lookup', { domain });

  try {
    const resolver = new Resolver();
    resolver.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
    // AFAIK Cloudflare and Google are good DNS servers to use for this, at least they are the biggest ones.
    // to scale it further, we could use more provider, or lookup through network HTTP requests.
    const records = await resolver.resolveTxt(domain);
    const values = recordsToStrings(records);
    const withPrefix = values.filter((v) => v.startsWith(TXT_PREFIX));

    console.info('[domain-verify] DNS TXT response', {
      domain,
      recordCount: values.length,
      verificationPrefixedCount: withPrefix.length,
    });

    for (const value of values) {
      if (txtValuesMatch(expected, value)) {
        console.info('[domain-verify] match found', { domain });
        return { outcome: 'claimed', failureReason: null };
      }
    }

    const failureReason =
      'We could not verify ownership yet. It may take up to 72 hours for the DNS to update. Please try again later.';

    console.warn('[domain-verify] no matching TXT', {
      domain,
      recordCount: values.length,
      verificationPrefixedCount: withPrefix.length,
      outcome: 'rejected',
    });

    return {
      outcome: 'rejected',
      failureReason,
    };
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : null;

    if (code === 'ENODATA' || code === 'ENOTFOUND') {
      console.warn('[domain-verify] no TXT records', {
        domain,
        code,
        outcome: 'rejected',
      });
      return {
        outcome: 'rejected',
        failureReason: 'No TXT records found for domain',
      };
    }

    const message = error instanceof Error ? error.message : 'DNS lookup failed';

    console.error('[domain-verify] DNS lookup error', {
      domain,
      code,
      message,
      outcome: 'failed',
    });

    return {
      outcome: 'failed',
      failureReason: message,
    };
  }
}

async function applyOutcome(
  verificationId: string,
  domainId: string,
  outcome: CheckOutcome,
  failureReason: string | null
) {
  const supabase = createAdminClient();
  const checkedAt = new Date().toISOString();

  const { error: verificationError } = await supabase
    .from('verifications')
    .update({
      status: outcome,
      failure_reason: failureReason,
      last_checked_at: checkedAt,
    })
    .eq('id', verificationId);

  if (verificationError) {
    throw new Error(verificationError.message);
  }

  const { error: domainError } = await supabase
    .from('domains')
    .update(outcome === 'claimed' ? { status: outcome } : { status: outcome, claimed_at: null })
    .eq('id', domainId)
    .eq('current_verification_id', verificationId);

  if (domainError) {
    throw new Error(domainError.message);
  }
}

type DomainEmbed = { id: string; domain: string };

type VerificationRow = {
  id: string;
  domain_id: string;
  token: string;
  status: string;
  domains: DomainEmbed | DomainEmbed[] | null;
};

function domainFromRow(row: VerificationRow): DomainEmbed | null {
  if (!row.domains) {
    return null;
  }
  return Array.isArray(row.domains) ? (row.domains[0] ?? null) : row.domains;
}

async function checkVerificationRow(
  row: VerificationRow,
  options: { demoteFailedToRejected: boolean }
): Promise<CheckResult> {
  const domain = domainFromRow(row);

  if (!domain) {
    return {
      verificationId: row.id,
      domainId: row.domain_id,
      domain: '',
      outcome: 'failed',
      failureReason: 'Domain row missing',
    };
  }

  let { outcome, failureReason } = await lookupTxtOutcome(domain.domain, row.token);

  if (options.demoteFailedToRejected && outcome === 'failed') {
    outcome = 'rejected';
    failureReason = failureReason
      ? `Retry exhausted: ${failureReason}`
      : 'Retry exhausted after failed DNS lookup';
  }

  await applyOutcome(row.id, row.domain_id, outcome, failureReason);

  return {
    verificationId: row.id,
    domainId: row.domain_id,
    domain: domain.domain,
    outcome,
    failureReason,
  };
}

export async function verifyDomain(domainId: string): Promise<CheckResult> {
  const admin = createAdminClient();

  const { data: domain, error: domainError } = await admin
    .from('domains')
    .select('id, domain, current_verification_id')
    .eq('id', domainId)
    .maybeSingle();

  if (domainError) {
    throw new Error(domainError.message);
  }

  if (!domain) {
    throw new DomainError(DomainErrorCode.DOMAIN_NOT_FOUND);
  }

  if (!domain.current_verification_id) {
    throw new DomainError(DomainErrorCode.NO_ACTIVE_VERIFICATION);
  }

  console.info('[domain-verify] starting check', {
    domainId: domain.id,
    domain: domain.domain,
    verificationId: domain.current_verification_id,
  });

  const { data: verification, error: verificationError } = await admin
    .from('verifications')
    .select('id, domain_id, token, status')
    .eq('id', domain.current_verification_id)
    .maybeSingle();

  if (verificationError) {
    throw new Error(verificationError.message);
  }

  if (!verification) {
    throw new DomainError(DomainErrorCode.VERIFICATION_NOT_FOUND);
  }

  const result = await checkVerificationRow(
    {
      id: verification.id,
      domain_id: verification.domain_id,
      token: verification.token,
      status: verification.status,
      domains: { id: domain.id, domain: domain.domain },
    },
    { demoteFailedToRejected: false }
  );

  console.info('[domain-verify] finished', {
    domain: result.domain,
    outcome: result.outcome,
    failureReason: result.failureReason,
  });

  return result;
}

export async function checkFailedVerifications(): Promise<CheckResult[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('verifications')
    .select('id, domain_id, token, status, domains(id, domain)')
    .eq('status', 'failed');

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as VerificationRow[];
  const results: CheckResult[] = [];

  for (const row of rows) {
    results.push(await checkVerificationRow(row, { demoteFailedToRejected: true }));
  }

  return results;
}
