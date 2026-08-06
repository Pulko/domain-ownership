'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { addDomainAction } from '@/app/actions/domains';

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
      const result = await addDomainAction(domain);

      if (!result.ok) {
        throw new Error(result.error);
      }

      setDomain('');
      onAdded(result.domain.id);
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
