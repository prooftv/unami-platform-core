'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export function RunSchedulerButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setResult(null);
    try {
      const res = await fetch('/api/run-spatial-scheduler', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SPATIAL_SCHEDULER_SECRET ?? ''}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Ran: ${data.ran?.join(', ') ?? 'all pipelines'}`);
        router.refresh();
      } else {
        setResult(data.error ?? 'Failed');
      }
    } catch (e) {
      setResult(String(e));
    }
    setPending(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
      <Button onClick={run} disabled={pending}>
        <Play className="size-4 mr-1" />
        {pending ? 'Running…' : 'Run all pipelines'}
      </Button>
    </div>
  );
}
