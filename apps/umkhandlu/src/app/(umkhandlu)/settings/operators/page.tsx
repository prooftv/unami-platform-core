import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OperatorList } from '../_components/OperatorList';
import { InviteOperatorForm } from '../_components/InviteOperatorForm';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

type AuthUser = {
  id: string;
  email: string;
  app_metadata: { role?: string };
  last_sign_in_at: string | null;
  created_at: string;
};

async function getOperators(): Promise<AuthUser[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users ?? [];
  } catch {
    return [];
  }
}

export default async function OperatorsPage() {
  const session = await getOperatorSession();
  const isAdmin = isSuperAdmin(session);
  const operators = isAdmin ? await getOperators() : [];

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold">Operators</h2>
          <p className="text-sm text-muted-foreground">Operator access is managed by a Super Admin</p>
        </div>
        <p className="text-sm text-muted-foreground">You do not have permission to manage operators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Operators</h2>
        <p className="text-sm text-muted-foreground">Manage who has access to the Control Centre</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Current Operators</CardTitle>
          <CardDescription>All users with access to the Control Centre</CardDescription>
        </CardHeader>
        <CardContent>
          <OperatorList operators={operators} currentUserId={session!.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invite Operator</CardTitle>
          <CardDescription>Add a new operator to the Control Centre</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteOperatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
