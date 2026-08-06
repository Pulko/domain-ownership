'use client';

import { DomainCard } from '@/components/domains/domain-card';
import { useDomainActions } from '@/components/domains/hooks/use-domain-actions';
import type { DomainListItem } from '@/lib/data/domains';

type DomainListProps = {
  domains: DomainListItem[];
  expandedId: string | null;
  onExpandedChange: (domainId: string | null) => void;
  onStartOver: (domainId: string) => void;
  onDeleted: (domainId: string) => void;
};

export function DomainList({
  domains,
  expandedId,
  onExpandedChange,
  onStartOver,
  onDeleted,
}: DomainListProps) {
  const { verifyingId, restartingId, deletingId, actionError, verify, startOver, remove } =
    useDomainActions({
      expandedId,
      onExpandedChange,
      onStartOver,
      onDeleted,
    });

  if (domains.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {domains.map((domain) => {
          const expanded = expandedId === domain.id && Boolean(domain.txtRecord);
          return (
            <DomainCard
              key={domain.id}
              domain={domain}
              expanded={expanded}
              verifying={verifyingId === domain.id}
              restarting={restartingId === domain.id}
              deleting={deletingId === domain.id}
              onVerify={() => verify(domain)}
              onStartOver={() => startOver(domain)}
              onDelete={() => remove(domain)}
              onToggleTxt={() => onExpandedChange(expanded ? null : domain.id)}
              onHideTxt={() => onExpandedChange(null)}
            />
          );
        })}
      </ul>
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
    </div>
  );
}
