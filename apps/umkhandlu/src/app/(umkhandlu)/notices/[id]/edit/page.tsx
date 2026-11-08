import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { NoticeForm } from '../../_components/NoticeForm';

export const dynamic = 'force-dynamic';

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: notice } = await supabase
    .from('notices')
    .select('id, type, title, content, status, comment_deadline, ward_ref, latitude, longitude')
    .eq('id', id)
    .single();

  if (!notice) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Notice"
        description={notice.title}
        actions={
          <Button asChild variant="outline">
            <Link href={`/notices/${id}`}>Back to notice</Link>
          </Button>
        }
      />
      <NoticeForm notice={notice} />
    </div>
  );
}
