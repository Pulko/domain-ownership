'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddDomain } from '@/components/domains/hooks/use-add-domain';

type DomainAddFormProps = {
  onAdded: (domainId: string) => void;
};

export function DomainAddForm({ onAdded }: DomainAddFormProps) {
  const { domain, setDomain, error, clearError, isLoading, submit } = useAddDomain({ onAdded });

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="domain">Domain</Label>
        <div className="flex gap-2">
          <Input
            id="domain"
            name="domain"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onFocus={clearError}
            disabled={isLoading}
            autoComplete="off"
            required
          />
          <Button type="submit" disabled={isLoading || !domain.trim()}>
            {isLoading ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
