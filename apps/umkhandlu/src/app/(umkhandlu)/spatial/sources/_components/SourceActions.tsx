'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deactivateSourceAction, reactivateSourceAction, runHealthCheckAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Activity, PowerOff, Power } from 'lucide-react';

interface Props {
  id: string;
  active: boolean;
}

export function SourceActions({ id, active }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function toggle() {
    setPending('toggle');
    const res = active ? await deactivateSourceAction(id) : await reactivateSourceAction(id);
    if (res.error) setResult(res.error);
    else router.refresh();
    setPending(null);
  }

  async function healthCheck() {
    setPending('health');
    setResult(null);
    const res = await runHealthCheckAction(id);
    if (res.error) {
      setResult(res.error);
    } else if (res.results) {
      const r = res.results[0];
      setResult(r ? (r.reachable ? `Reachable — ${r.responseMs}ms` : 'Unreachable') : 'No result');
    }
    setPending(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={healthCheck} disabled={!!pending}>
        <Activity className="size-4 mr-1" />
        {pending === 'health' ? 'Checking…' : 'Health check'}
      </Button>
      <Button size="sm" variant="outline" onClick={toggle} disabled={!!pending}>
        {active
          ? <><PowerOff className="size-4 mr-1" />{pending === 'toggle' ? 'Deactivating…' : 'Deactivate'}</>
          : <><Power className="size-4 mr-1" />{pending === 'toggle' ? 'Activating…' : 'Reactivate'}</>
        }
      </Button>
      {result && <p className="text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}
