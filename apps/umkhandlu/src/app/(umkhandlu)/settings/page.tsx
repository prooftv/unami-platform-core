import { PageHeader } from '@unami/ui';
import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProfileForm } from './ProfileForm';
import { InviteOperatorForm } from './InviteOperatorForm';
import { OperatorList } from './OperatorList';

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
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users ?? [];
  } catch {
    return [];
  }
}

export default async function SettingsPage() {
  const session = await getOperatorSession();
  const isAdmin = isSuperAdmin(session);
  const operators = isAdmin ? await getOperators() : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Control Centre operator preferences and access management"
      />

      <div className="max-w-2xl space-y-6">

        {/* Profile */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">Profile</CardTitle>
            <CardDescription className="text-xs mt-0.5">Your operator account details</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ProfileForm
              currentName={session?.name ?? ''}
              email={session?.email ?? ''}
              role={session?.role ?? 'operator'}
            />
          </CardContent>
        </Card>

        {/* Operator management — super_admin only */}
        {isAdmin && (
          <>
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold">Operators</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Manage who has access to the Control Centre
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <OperatorList operators={operators} currentUserId={session!.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-semibold">Invite Operator</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Add a new operator to the Control Centre
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <InviteOperatorForm />
              </CardContent>
            </Card>
          </>
        )}

        {/* Platform info */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">Platform</CardTitle>
            <CardDescription className="text-xs mt-0.5">Control Centre version and environment</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {[
              { label: 'Application',       value: 'Unami Control Centre' },
              { label: 'Phase',             value: '18D — Cross-Node Aggregation' },
              { label: 'Node API Contract', value: 'v1.0' },
              { label: 'Supabase Project',  value: 'ufsmpqxniswdnsywjzje' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium font-mono text-xs">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
