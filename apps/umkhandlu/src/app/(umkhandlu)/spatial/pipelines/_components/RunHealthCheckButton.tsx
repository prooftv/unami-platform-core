'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runHealthCheckAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

export function RunHealthCheckButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setResult(null);
    const res = await runHealthCheckAction();
    if (res.error) {
      setResult(res.error);
    } else if (res.results) {
      const reachable = res.results.filter((r) => r.reachable).length;
      setResult(`${reachable}/${res.results.length} sources reachable`);
    }
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
      <Button onClick={run} disabled={pending}>
        <Activity className="size-4 mr-1" />
        {pending ? 'Running…' : 'Run health check'}
      </Button>
    </div>
  );
}
