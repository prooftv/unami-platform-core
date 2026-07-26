import { PageHeader } from '@moments/ui';
import { getOperatorSession } from '@/lib/auth/operator';
import { redirect } from 'next/navigation';

const ROLE_LABELS = {
  superadmin:    'Super Admin',
  content_admin: 'Content Admin',
  moderator:     'Moderator',
  viewer:        'Viewer',
} as const;

export default async function DashboardPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Moments v2 admin"
      />

      <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-sm">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Signed in as
          </p>
          <p className="text-sm font-medium">{session.name ?? session.email}</p>
          <p className="text-xs text-muted-foreground">{session.email}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Role
          </p>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {ROLE_LABELS[session.role]}
          </span>
        </div>

        {session.authority_id && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Authority
            </p>
            <p className="text-xs font-mono text-muted-foreground">{session.authority_id}</p>
          </div>
        )}
      </div>
    </div>
  );
}
