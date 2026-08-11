import Link from 'next/link';
import { ErrorState } from '@unami/ui';
import { Button } from '@/components/ui/button';

export default function AlertNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <ErrorState
        title="Alert not found"
        description="This alert does not exist or has been removed."
        action={
          <Button variant="outline" asChild>
            <Link href="/alerts">Back to Alerts</Link>
          </Button>
        }
      />
    </div>
  );
}
