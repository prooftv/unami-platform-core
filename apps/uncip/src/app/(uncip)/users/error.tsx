'use client';

import { useEffect } from 'react';
import { ErrorState } from '@unami/ui';
import { Button } from '@/components/ui/button';

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UNCIP/users]', error.digest ?? 'no digest');
  }, [error]);

  return (
    <ErrorState
      title="Unable to load users"
      description="Something went wrong. Please try again."
      action={<Button onClick={reset} variant="outline" size="sm">Try again</Button>}
    />
  );
}
