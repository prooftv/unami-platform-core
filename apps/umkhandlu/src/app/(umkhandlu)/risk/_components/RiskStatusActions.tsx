'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { closeRiskAction } from '../_actions';
import { Button } from '@/components/ui/button';

interface Props { id: string; status: string }

export function RiskStatusActions({ id, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'closed' | 'accepted') {
    setPending(action);
    setError(null);
    const res = await closeRiskAction(id, action);
    if (res.error) setError(res.error);
    else router.refresh();
    setPending(null);
  }

  if (status === 'closed' || status === 'accepted') return null;

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" variant="outline" onClick={() => act('accepted')} disabled={!!pending}>
        {pending === 'accepted' ? 'Saving…' : 'Accept risk'}
      </Button>
      <Button size="sm" variant="outline" onClick={() => act('closed')} disabled={!!pending}>
        {pending === 'closed' ? 'Saving…' : 'Close risk'}
      </Button>
    </div>
  );
}
