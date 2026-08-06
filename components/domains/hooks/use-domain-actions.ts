'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const response = await fetch(`/api/domains/${domain.id}/verify`, {
        method: 'POST',
      });

      const data = (await response.json()) as {
        status?: string;
        failureReason?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Verification failed');
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
      const response = await fetch(`/api/domains/${domain.id}/verifications`, {
        method: 'POST',
      });

      const data = (await response.json()) as {
        domain?: { id: string; domain: string };
        txtRecord?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to regenerate verification');
      }

      if (!data.domain || !data.txtRecord) {
        throw new Error('Unexpected response from server');
      }

      onStartOver(data.domain.id);
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
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to delete domain');
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
