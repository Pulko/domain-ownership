import { Suspense } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { GetStartedButton } from '@/components/auth/get-started-button';
import { Button } from '@/components/ui/button';
import { TXT_PREFIX } from '@/lib/domain-verification/token';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <AppShell>
      <div className="flex flex-col gap-12 py-4">
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Prove you own a domain</h1>
          <p className="leading-relaxed text-muted-foreground">
            Domain Ownership lets you verify control of a domain by publishing a short-lived TXT
            record in DNS. Once the record matches, the domain is marked as claimed for your
            account.
          </p>
          <div className="pt-1">
            <Suspense fallback={<Button disabled>Get started</Button>}>
              <GetStartedButton />
            </Suspense>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>How verification works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Add a domain</span>
                {' — '}
                enter the hostname (or a full URL). We normalize it to the apex domain.
              </li>
              <li>
                <span className="font-medium text-foreground">Publish a TXT record</span>
                {' — '}
                at your DNS registrar, create a TXT record on the apex host with the value we give
                you (prefixed with{' '}
                <code className="font-mono text-xs text-foreground">{TXT_PREFIX}</code>
                ).
              </li>
              <li>
                <span className="font-medium text-foreground">Verify</span>
                {' — '}
                we look up the TXT records for your domain. If the value matches, ownership is
                claimed.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
