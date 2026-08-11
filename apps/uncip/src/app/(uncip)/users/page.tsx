import { PageHeader, DataTable, type ColumnDef } from '@unami/ui';
import { FIXTURE_USERS } from '@/fixtures/uncip';
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

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`${FIXTURE_USERS.length} registered users.`}
      />
      <DataTable
        columns={COLUMNS}
        data={FIXTURE_USERS}
        getRowKey={(u) => u.id}
      />
    </div>
  );
}
