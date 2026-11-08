import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FindingForm } from '../_components/FindingForm';

export default function NewFindingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Finding"
        description="Record a gap, exception or incident."
        actions={<Button variant="outline" asChild><Link href="/findings">Back</Link></Button>}
      />
      <FindingForm />
    </div>
  );
}
