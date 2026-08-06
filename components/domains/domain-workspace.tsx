'use client';

import { useState } from 'react';

import { DomainAddForm } from '@/components/domains/domain-add-form';
import { DnsHelpGuide } from '@/components/domains/dns-help-guide';
import { DomainList } from '@/components/domains/domain-list';
import type { DomainListItem } from '@/lib/data/domains';
import clsx from 'clsx';

type DomainWorkspaceProps = {
  initialDomains: DomainListItem[];
};

export function DomainWorkspace({ initialDomains }: DomainWorkspaceProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleDeleted(domainId: string) {
    setExpandedId((current) => (current === domainId ? null : current));
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a domain, publish the TXT record, then verify ownership.
          </p>
        </div>
        <DomainAddForm onAdded={(domainId) => setExpandedId(domainId)} />

        <DnsHelpGuide />
      </section>

      <section
        className={clsx(
          'flex flex-col gap-3 pt-3',
          initialDomains.length > 0 ? 'border-t border-border' : ''
        )}
      >
        <DomainList
          domains={initialDomains}
          expandedId={expandedId}
          onExpandedChange={setExpandedId}
          onStartOver={setExpandedId}
          onDeleted={handleDeleted}
        />
      </section>
    </div>
  );
}
