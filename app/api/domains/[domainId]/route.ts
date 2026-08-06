import { deleteDomain } from '@/lib/data/domains';
import { domainErrorResponse } from '@/lib/errors';

type RouteContext = {
  params: Promise<{ domainId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { domainId } = await context.params;

  try {
    await deleteDomain(domainId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return domainErrorResponse(error, 'Failed to delete domain');
  }
}
