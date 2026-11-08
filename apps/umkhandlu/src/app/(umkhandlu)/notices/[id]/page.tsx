import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { NoticeStatusActions } from './_components/NoticeStatusActions';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-700',
  published:  'bg-blue-100 text-blue-800',
  open:       'bg-green-100 text-green-800',
  closed:     'bg-gray-100 text-gray-700',
  approved:   'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  withdrawn:  'bg-amber-100 text-amber-800',
  archived:   'bg-gray-100 text-gray-600',
};

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: notice } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single();

  if (!notice) notFound();

  const canPublish = notice.status === 'draft';
  const canClose   = notice.status === 'open' || notice.status === 'published';

  // Pre-fill compliance obligation URL params for statutory notices
  const complianceParams = notice.is_statutory
    ? new URLSearchParams({
        title:             `${notice.title} — Comment Period`,
        source:            `Notice: ${notice.type.replace(/-/g, ' ')} — ${notice.title}`,
        responsible_party: 'Amajuba District Municipality',
        due_date:          notice.comment_deadline ?? '',
        identifier:        `N-${id.slice(0, 8).toUpperCase()}`,
      }).toString()
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={notice.title}
        description={`${notice.type.replace(/-/g, ' ')} · ${notice.is_statutory ? 'Statutory notice' : 'Governance notice'}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/notices">Back</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/notices/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[notice.status] ?? ''}`}>
                {notice.status}
              </span>
              {notice.is_statutory && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800">
                  Statutory
                </span>
              )}
              <NoticeStatusActions
                id={id}
                canPublish={canPublish}
                canClose={canClose}
                isStatutory={notice.is_statutory}
                hasDeadline={!!notice.comment_deadline}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Geographic Context</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {notice.ward_ref ? (
                <p><span className="text-muted-foreground">Ward:</span> {notice.ward_ref}</p>
              ) : (
                <p className="text-muted-foreground text-xs">No ward reference set.</p>
              )}
              {notice.latitude && notice.longitude ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {notice.latitude.toFixed(5)}, {notice.longitude.toFixed(5)}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-1">
                    <Link href="/spatial/map">View on map</Link>
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No coordinates set. Edit this notice to add geographic context.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
          </CardContent>
        </Card>

        {notice.comment_deadline && (
          <Card>
            <CardHeader><CardTitle>Comment Period</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Deadline:</span>{' '}
                <span className="font-medium">{new Date(notice.comment_deadline).toLocaleDateString('en-ZA', { dateStyle: 'long' })}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Comments received:</span>{' '}
                {notice.comments_received ?? 0}
              </p>
            </CardContent>
          </Card>
        )}

        {complianceParams && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="text-sm text-purple-900">Compliance Obligation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-purple-800">
                This is a statutory notice. If it creates a compliance obligation (e.g. a comment period that must be tracked), create a compliance record now.
              </p>
              <Button asChild variant="outline" size="sm" className="border-purple-300 text-purple-900 hover:bg-purple-100">
                <Link href={`/compliance/new?${complianceParams}`}>
                  Create compliance obligation →
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>Created by: {notice.created_by}</span>
            <span>Created: {new Date(notice.created_at).toLocaleDateString()}</span>
            <span>Updated: {new Date(notice.updated_at).toLocaleDateString()}</span>
            <span>ID: {notice.id}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
