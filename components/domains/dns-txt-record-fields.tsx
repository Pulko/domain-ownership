'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

type DnsTxtRecordFieldsProps = {
  host: string;
  txtRecord: string;
  onDismiss: () => void;
};

export function DnsTxtRecordFields({ host, txtRecord, onDismiss }: DnsTxtRecordFieldsProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(txtRecord);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">TXT record</p>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss} className="shrink-0">
          Hide
        </Button>
      </div>

      <dl className="grid gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Host / Name</dt>
          <dd className="break-all rounded-md border border-border px-3 py-2 font-mono text-xs">
            @ <span className="text-muted-foreground">({host})</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="rounded-md border border-border px-3 py-2 font-mono text-xs">TXT</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Value</dt>
          <dd className="flex items-start gap-2">
            <code className="flex-1 break-all rounded-md border border-border px-3 py-2 font-mono text-xs">
              {txtRecord}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyValue}>
              {copied ? ' ✔️ Copied' : 'Copy'}
            </Button>
          </dd>
        </div>
      </dl>
    </div>
  );
}
