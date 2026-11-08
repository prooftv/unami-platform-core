import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { RiskForm } from '../_components/RiskForm';

export const dynamic = 'force-dynamic';

export default async function NewRiskPage() {
  const supabase = createServiceClient();
  const { data: registers } = await supabase
    .from('risk_registers')
    .select('id, title')
    .eq('status', 'active')
    .order('title');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Risk"
        description="Record a new risk in the register."
        actions={<Button variant="outline" asChild><Link href="/risk">Back</Link></Button>}
      />
      <RiskForm registers={registers ?? []} />
    </div>
  );
}
