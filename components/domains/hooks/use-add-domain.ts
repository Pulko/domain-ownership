'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Domain } from '@/lib/data/domains';

type UseAddDomainOptions = {
  onAdded: (domainId: string) => void;
};

export function useAddDomain({ onAdded }: UseAddDomainOptions) {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function clearError() {
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = (await response.json()) as {
        domain?: Domain;
        txtRecord?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to add domain');
      }

      if (!data.domain || !data.txtRecord) {
        throw new Error('Unexpected response from server');
      }

      setDomain('');
      onAdded(data.domain.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    domain,
    setDomain,
    error,
    clearError,
    isLoading,
    submit,
  };
}
