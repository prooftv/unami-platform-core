'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toggleCollectorActive } from '../_actions';

export function CollectorToggle({
  collectorId,
  active,
}: {
  collectorId: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={active ? 'destructive' : 'default'}
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => { void toggleCollectorActive(collectorId, !active); })}
    >
      {pending ? 'Saving…' : active ? 'Deactivate' : 'Reactivate'}
    </Button>
  );
}
