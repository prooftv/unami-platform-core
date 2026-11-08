import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const actionColour: Record<string, string> = {
  create:  'bg-green-100 text-green-800',
  update:  'bg-blue-100 text-blue-800',
  delete:  'bg-red-100 text-red-800',
  approve: 'bg-green-100 text-green-800',
  reject:  'bg-red-100 text-red-800',
  publish: 'bg-purple-100 text-purple-800',
  archive: 'bg-gray-100 text-gray-700',
};

interface Props { searchParams: Promise<{ table?: string }> }

export default async function AuditLogPage({ searchParams }: Props) {
  const { table } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from('gis_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (table) query = query.eq('table_name', table);

  const { data: logs } = await query;
  const rows = logs ?? [];

  const tables = Array.from(new Set(rows.map((r) => r.table_name))).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable record of all state changes across GIS, risk and compliance."
      />

      {tables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a
            href="/audit-log"
            className={`text-xs px-3 py-1 rounded-full border ${!table ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
          >
            All
          </a>
          {tables.map((t) => (
            <a
              key={t}
              href={`/audit-log?table=${t}`}
              className={`text-xs px-3 py-1 rounded-full border ${table === t ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            >
              {t}
            </a>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {rows.length} event{rows.length !== 1 ? 's' : ''}
            {table ? ` — ${table}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No audit events recorded yet.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((log) => (
                <div key={log.id} className="px-6 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${actionColour[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-medium truncate">{log.table_name}</span>
                      <span className="text-xs text-muted-foreground font-mono truncate">{log.record_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Actor: {log.actor}</p>
                  {log.reason && <p className="text-xs text-muted-foreground">Reason: {log.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
