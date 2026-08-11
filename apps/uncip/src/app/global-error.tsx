'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production — never expose to UI
    console.error('[UNCIP] Unhandled error:', error.digest ?? 'no digest');
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
