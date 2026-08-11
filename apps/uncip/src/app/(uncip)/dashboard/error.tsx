'use client';

import { useEffect } from 'react';
import { ErrorState } from '@unami/ui';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UNCIP/dashboard]', error.digest ?? 'no digest');
  }, [error]);

  return (
    <ErrorState
      title="Dashboard unavailable"
      description="Something went wrong loading the dashboard. Please try again."
      action={<Button onClick={reset} variant="outline" size="sm">Try again</Button>}
    />
  );
}
