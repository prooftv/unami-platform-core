import { PageHeader, EmptyState } from '@unami/ui';
import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage school staff, authority users, and community members."
      />
      <EmptyState
        title="No users"
        description="Invited users will appear here once the backend is connected."
        icon={Users}
      />
    </div>
  );
}
