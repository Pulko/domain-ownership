import { addDomain } from '@/lib/data/domains';
import { domainErrorResponse } from '@/lib/errors';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const domain =
    body &&
    typeof body === 'object' &&
    'domain' in body &&
    typeof (body as { domain: unknown }).domain === 'string'
      ? (body as { domain: string }).domain
      : null;

  if (!domain?.trim()) {
    return Response.json({ error: 'Body must include a non-empty domain string' }, { status: 400 });
  }

  try {
    const result = await addDomain(domain);
    return Response.json(
      {
        domain: result.domain,
        verification: result.verification,
        txtRecord: result.txtRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    return domainErrorResponse(error, 'Failed to add domain');
  }
}
