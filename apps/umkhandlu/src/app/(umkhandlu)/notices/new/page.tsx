import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { NoticeForm } from '../_components/NoticeForm';

export default function NewNoticePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Notice"
        description="Record a governance or statutory notice for Amajuba District."
        actions={
          <Button asChild variant="outline">
            <Link href="/notices">Back to notices</Link>
          </Button>
        }
      />
      <NoticeForm />
    </div>
  );
}
