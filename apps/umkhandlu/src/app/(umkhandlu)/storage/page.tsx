import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const BUCKET_LABELS: Record<string, { label: string; description: string; public: boolean }> = {
  'field-evidence': { label: 'Field Evidence', description: 'Photographs, site evidence and collector attachments', public: false },
  'governance-evidence': { label: 'Governance Evidence', description: 'Notice evidence, planning documents and review records', public: false },
  'public-assets': { label: 'Public Assets', description: 'Approved public images, documents and media', public: true },
  'spatial-exports': { label: 'Spatial Exports', description: 'Generated reports, map exports and downloadable datasets', public: false },
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default async function StoragePage() {
  const supabase = createServiceClient();

  const { data: objects } = await supabase
    .from('storage_objects')
    .select('id, bucket_id, filename, mime_type, size_bytes, uploaded_by, uploaded_at, access_class, submission_id, notice_id, deleted_at')
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
    .limit(200);

  const rows = objects ?? [];

  const byBucket = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    if (!acc[r.bucket_id]) acc[r.bucket_id] = [];
    acc[r.bucket_id].push(r);
    return acc;
  }, {});

  const totalSize = rows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage"
        description="Evidence files, governance documents and spatial exports stored in Supabase Storage."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Total files</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{formatBytes(totalSize)}</p>
          <p className="text-sm text-muted-foreground">Total size</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{rows.filter((r) => r.access_class === 'approved-public').length}</p>
          <p className="text-sm text-muted-foreground">Public files</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{rows.filter((r) => r.access_class === 'private').length}</p>
          <p className="text-sm text-muted-foreground">Private files</p>
        </CardContent></Card>
      </div>

      {Object.entries(BUCKET_LABELS).map(([bucketId, meta]) => {
        const bucketRows = byBucket[bucketId] ?? [];
        const bucketSize = bucketRows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);
        return (
          <Card key={bucketId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{meta.label}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={meta.public ? 'default' : 'secondary'}>
                    {meta.public ? 'Public' : 'Private'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {bucketRows.length} files · {formatBytes(bucketSize)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {bucketRows.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                  No files in this bucket.
                </div>
              ) : (
                <div className="divide-y">
                  {bucketRows.slice(0, 20).map((r) => (
                    <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <a
                          href={`/api/attachments/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline truncate block"
                        >
                          {r.filename}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {r.mime_type} · {formatBytes(r.size_bytes)} · {r.uploaded_by}
                        </p>
                        {r.submission_id && (
                          <Link href={`/spatial/field-submissions/${r.submission_id}`} className="text-xs text-blue-600 hover:underline">
                            Field submission →
                          </Link>
                        )}
                        {r.notice_id && (
                          <Link href={`/notices/${r.notice_id}`} className="text-xs text-blue-600 hover:underline">
                            Notice →
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(r.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {bucketRows.length > 20 && (
                    <div className="px-6 py-3 text-xs text-muted-foreground">
                      +{bucketRows.length - 20} more files
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
