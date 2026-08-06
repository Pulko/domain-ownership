import { regenerateVerification } from '@/lib/data/domains';
import { domainErrorResponse } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ domainId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { domainId } = await context.params;

  try {
    const result = await regenerateVerification(domainId);
    return Response.json(
      {
        domain: result.domain,
        verification: result.verification,
        txtRecord: result.txtRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    return domainErrorResponse(error, 'Token regeneration failed');
  }
}
