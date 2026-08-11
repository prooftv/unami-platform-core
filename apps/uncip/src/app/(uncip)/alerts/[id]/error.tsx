'use client';

import { useEffect } from 'react';
import { ErrorState } from '@unami/ui';
import { Button } from '@/components/ui/button';

export default function AlertDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UNCIP/alerts/[id]]', error.digest ?? 'no digest');
  }, [error]);

  return (
    <ErrorState
      title="Unable to load alert"
      description="Something went wrong. Please try again."
      action={<Button onClick={reset} variant="outline" size="sm">Try again</Button>}
    />
  );
}
