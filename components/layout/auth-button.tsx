import Link from 'next/link';
import { Button } from '../ui/button';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '../auth/logout-button';
import { ThemeSwitcher } from './theme-switcher';

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      <Button asChild size="sm" variant="ghost">
        <Link href="/protected">Domains</Link>
      </Button>
      <ThemeSwitcher />
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <ThemeSwitcher />
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
