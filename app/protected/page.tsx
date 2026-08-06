import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { DomainWorkspace } from '@/components/domains/domain-workspace';
import { getDomains } from '@/lib/data/domains';
import { DomainError, DomainErrorCode } from '@/lib/errors';

function DomainsFallback() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
        </div>
      </section>
    </div>
  );
}

async function DomainsContent() {
  let domains;

  try {
    domains = await getDomains();
  } catch (error) {
    if (error instanceof DomainError && error.code === DomainErrorCode.UNAUTHORIZED) {
      redirect('/auth/login');
    }
    throw error;
  }

  return <DomainWorkspace initialDomains={domains} />;
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<DomainsFallback />}>
      <DomainsContent />
    </Suspense>
  );
}
