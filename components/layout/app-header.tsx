import Link from 'next/link';
import { Suspense } from 'react';

import { AuthButton } from '@/components/layout/auth-button';

export function AppHeader() {
  return (
    <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
      <div className="flex w-full max-w-2xl items-center justify-between p-3 px-5 text-sm">
        <Link href="/" className="font-semibold">
          🌐 Verify
        </Link>
        <Suspense>
          <AuthButton />
        </Suspense>
      </div>
    </nav>
  );
}
