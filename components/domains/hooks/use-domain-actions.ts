'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  deleteDomainAction,
  regenerateVerificationAction,
  verifyDomainAction,
} from '@/app/actions/domains';
import type { DomainListItem } from '@/lib/data/domains';

type UseDomainActionsOptions = {
  expandedId: string | null;
  onExpandedChange: (domainId: string | null) => void;
  onStartOver: (domainId: string) => void;
  onDeleted: (domainId: string) => void;
};

export function useDomainActions({
  expandedId,
  onExpandedChange,
  onStartOver,
  onDeleted,
}: UseDomainActionsOptions) {
  const router = useRouter();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function verify(domain: DomainListItem) {
    setActionError(null);
    setVerifyingId(domain.id);

    try {
      const result = await verifyDomainAction(domain.id);

      if (!result.ok) {
        throw new Error(result.error);
      }

      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  }

  async function startOver(domain: DomainListItem) {
    setActionError(null);
    setRestartingId(domain.id);

    try {
      const result = await regenerateVerificationAction(domain.id);

      if (!result.ok) {
        throw new Error(result.error);
      }

      onStartOver(result.domain.id);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to regenerate verification');
    } finally {
      setRestartingId(null);
    }
  }

  async function remove(domain: DomainListItem) {
    setActionError(null);
    setDeletingId(domain.id);

    try {
      const result = await deleteDomainAction(domain.id);

      if (!result.ok) {
        throw new Error(result.error);
      }

      if (expandedId === domain.id) {
        onExpandedChange(null);
      }
      onDeleted(domain.id);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete domain');
    } finally {
      setDeletingId(null);
    }
  }

  return {
    verifyingId,
    restartingId,
    deletingId,
    actionError,
    verify,
    startOver,
    remove,
  };
}
