import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUNCIPSession } from '@/lib/auth/operator';
import { PageHeader, DataTable, EmptyState, type ColumnDef } from '@unami/ui';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRoleBadge } from '@/components/uncip/user/UserRoleBadge';
import { Badge } from '@/components/ui/badge';
import type { UserRecord } from '@/domain/uncip/types';

const COLUMNS: ColumnDef<UserRecord>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (u) => <span className="font-medium">{u.name ?? '—'}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    cell: (u) => <UserRoleBadge role={u.role} />,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (u) =>
      u.isActive ? (
        <Badge variant="secondary">Active</Badge>
      ) : (
        <Badge variant="outline">Inactive</Badge>
      ),
  },
];

export default async function UsersPage() {
  const [session, supabase] = await Promise.all([getUNCIPSession(), createClient()]);
  const { data } = await supabase
    .from('uncip_user_profiles')
    .select('id, email, name, role, station_id, school_id, is_active, created_at')
    .order('created_at', { ascending: false });

  const users: UserRecord[] = (data ?? []).map((row) => ({
    id:        row.id,
    email:     row.email,
    name:      row.name ?? null,
    role:      row.role,
    stationId: row.station_id ?? null,
    schoolId:  row.school_id ?? null,
    isActive:  row.is_active,
    createdAt: row.created_at,
  }));

  const actions = session?.role === 'admin' ? (
    <Button asChild><Link href="/users/new">Invite User</Link></Button>
  ) : undefined;

  if (users.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Users" description="Manage registered users." actions={actions} />
        <EmptyState title="No users registered" description="Invited users will appear here." icon={Users} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${users.length} registered users.`} actions={actions} />
      <DataTable columns={COLUMNS} data={users} getRowKey={(u) => u.id} />
    </div>
  );
}
