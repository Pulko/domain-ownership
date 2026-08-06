import { createClient } from '@/lib/supabase/server';
import { verifyDomain } from '@/lib/domain-verification/check';
import { DomainError, DomainErrorCode, domainErrorResponse } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ domainId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { domainId } = await context.params;

  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      throw new DomainError(DomainErrorCode.UNAUTHORIZED);
    }

    const userId = claimsData.claims.sub as string;

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

    const result = await verifyDomain(domainId);
    return Response.json({
      status: result.outcome,
      failureReason: result.failureReason,
      domain: result.domain,
      verificationId: result.verificationId,
    });
  } catch (error) {
    return domainErrorResponse(error, 'Verification failed');
  }
}
