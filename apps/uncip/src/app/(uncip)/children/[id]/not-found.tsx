import Link from 'next/link';
import { ErrorState } from '@unami/ui';
import { Button } from '@/components/ui/button';

export default function ChildNotFound() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <ErrorState
        title="Child not found"
        description="This child record does not exist or has been removed."
        action={
          <Button variant="outline" asChild>
            <Link href="/children">Back to Children</Link>
          </Button>
        }
      />
    </div>
  );
}
