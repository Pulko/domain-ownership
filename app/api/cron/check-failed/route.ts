import { authorizeCron } from '@/lib/domain-verification/cron-auth';
import { checkFailedVerifications } from '@/lib/domain-verification/check';

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await checkFailedVerifications();
    return Response.json({
      checked: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed check retry failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
