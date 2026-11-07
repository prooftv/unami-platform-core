import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SourceForm } from '../_components/SourceForm';

export default function NewSourcePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Spatial Source"
        description="Register a new institutional GIS data source."
        actions={
          <Button variant="outline" asChild>
            <Link href="/spatial/sources">Back</Link>
          </Button>
        }
      />
      <SourceForm />
    </div>
  );
}
