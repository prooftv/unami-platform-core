import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DatasetForm } from '../_components/DatasetForm';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewDatasetPage() {
  const supabase = createServiceClient();
  const { data: sources } = await supabase
    .from('spatial_sources')
    .select('id, name, institution')
    .eq('active', true)
    .order('institution');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Dataset"
        description="Register a spatial layer or dataset against an institutional source."
        actions={
          <Button variant="outline" asChild>
            <Link href="/spatial/datasets">Back</Link>
          </Button>
        }
      />
      <DatasetForm sources={sources ?? []} />
    </div>
  );
}
