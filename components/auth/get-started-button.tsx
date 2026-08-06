import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export async function GetStartedButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const href = data?.claims ? '/protected' : '/auth/login';

  return (
    <Button asChild>
      <Link href={href}>Get started</Link>
    </Button>
  );
}
