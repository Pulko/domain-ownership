'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DNS_HELP_ANCHOR, DNS_HELP_OPEN_EVENT } from '@/components/domains/dns-help-guide';
import { DnsTxtRecordFields } from '@/components/domains/dns-txt-record-fields';
import type { DomainListItem } from '@/lib/data/domains';

type DomainCardProps = {
  domain: DomainListItem;
  expanded: boolean;
  verifying: boolean;
  restarting: boolean;
  deleting: boolean;
  onVerify: () => void;
  onStartOver: () => void;
  onDelete: () => void;
  onToggleTxt: () => void;
  onHideTxt: () => void;
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'claimed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function DomainCard({
  domain,
  expanded,
  verifying,
  restarting,
  deleting,
  onVerify,
  onStartOver,
  onDelete,
  onToggleTxt,
  onHideTxt,
}: DomainCardProps) {
  const [confirming, setConfirming] = useState(false);

  const canVerify =
    domain.status === 'pending' || domain.status === 'rejected' || domain.status === 'failed';
  const busy = verifying || restarting || deleting;
  const showNote =
    domain.failureReason && (domain.status === 'rejected' || domain.status === 'failed');
  const helpLinked = domain.status === 'rejected' || domain.status === 'failed';

  const statusBadge = (
    <Badge variant={statusVariant(domain.status)} className="shrink-0">
      {domain.status}
    </Badge>
  );

  return (
    <li className="flex flex-col gap-3 rounded-md border border-border px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">{domain.domain}</span>
        </div>
        {helpLinked ? (
          <a
            href={`#${DNS_HELP_ANCHOR}`}
            className="shrink-0 no-underline"
            onClick={() => {
              window.dispatchEvent(new Event(DNS_HELP_OPEN_EVENT));
            }}
          >
            {statusBadge}
          </a>
        ) : (
          statusBadge
        )}
      </div>

      {showNote ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Latest check: {domain.failureReason}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>Created {formatDate(domain.created_at)}</span>
        {domain.status === 'claimed' && domain.claimed_at ? (
          <span>Claimed {formatDate(domain.claimed_at)}</span>
        ) : null}
      </div>

      {confirming ? (
        <div className="flex gap-2 pt-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Delete this domain? This cannot be undone.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {canVerify ? (
            <Button type="button" size="sm" disabled={busy} onClick={onVerify}>
              {verifying ? 'Verifying…' : 'Verify'}
            </Button>
          ) : null}
          {canVerify && domain.txtRecord ? (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onToggleTxt}>
              {expanded ? 'Hide TXT' : 'Show TXT'}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onStartOver}>
            {restarting ? 'Restarting…' : 'Start over'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
        </div>
      )}

      {expanded && domain.txtRecord ? (
        <DnsTxtRecordFields
          host={domain.domain}
          txtRecord={domain.txtRecord}
          onDismiss={onHideTxt}
        />
      ) : null}
    </li>
  );
}
