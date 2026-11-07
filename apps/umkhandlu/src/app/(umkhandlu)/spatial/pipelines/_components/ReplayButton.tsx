'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runHealthCheckAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface Props { runId: string }

export function ReplayButton({ runId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function replay() {
    setPending(true);
    // Health check replay — re-runs the check for all sources
    await runHealthCheckAction();
    setPending(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="ghost" onClick={replay} disabled={pending} title={`Replay run ${runId}`}>
      <RotateCcw className="size-3" />
    </Button>
  );
}
