'use server';

import { revalidatePath } from 'next/cache';

import {
  addDomain,
  assertUserOwnsDomain,
  deleteDomain,
  regenerateVerification,
  type Domain,
  type Verification,
} from '@/lib/data/domains';
import { verifyDomain } from '@/lib/domain-verification/check';
import { type ActionResult, toActionError } from '@/lib/errors';

function revalidateDomains() {
  revalidatePath('/protected');
}

export async function addDomainAction(domain: string): Promise<
  ActionResult<{
    domain: Domain;
    verification: Verification;
    txtRecord: string;
  }>
> {
  try {
    const result = await addDomain(domain);
    revalidateDomains();
    return { ok: true, ...result };
  } catch (error) {
    return toActionError(error, 'Failed to add domain');
  }
}

export async function deleteDomainAction(domainId: string): Promise<ActionResult> {
  try {
    await deleteDomain(domainId);
    revalidateDomains();
    return { ok: true };
  } catch (error) {
    return toActionError(error, 'Failed to delete domain');
  }
}

export async function regenerateVerificationAction(domainId: string): Promise<
  ActionResult<{
    domain: Domain;
    verification: Verification;
    txtRecord: string;
  }>
> {
  try {
    const result = await regenerateVerification(domainId);
    revalidateDomains();
    return { ok: true, ...result };
  } catch (error) {
    return toActionError(error, 'Token regeneration failed');
  }
}

export async function verifyDomainAction(domainId: string): Promise<
  ActionResult<{
    status: string;
    failureReason: string | null;
    domain: string;
    verificationId: string;
  }>
> {
  try {
    await assertUserOwnsDomain(domainId);
    const result = await verifyDomain(domainId);
    revalidateDomains();
    return {
      ok: true,
      status: result.outcome,
      failureReason: result.failureReason,
      domain: result.domain,
      verificationId: result.verificationId,
    };
  } catch (error) {
    return toActionError(error, 'Verification failed');
  }
}
