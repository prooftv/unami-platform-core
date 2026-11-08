import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ObligationForm } from '../_components/ObligationForm';

export default function NewObligationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Obligation"
        description="Record a new compliance obligation."
        actions={<Button variant="outline" asChild><Link href="/compliance">Back</Link></Button>}
      />
      <ObligationForm />
    </div>
  );
}
