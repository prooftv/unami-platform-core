import { PageHeader } from '@unami/ui';
import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

const navItems = [
  { href: '#profile', label: 'Profile' },
  { href: '#operators', label: 'Operators' },
  { href: '#platform', label: 'Platform' },
];

export default async function SettingsPage() {
  const session = await getOperatorSession();
  const isAdmin = isSuperAdmin(session);
  const operators = isAdmin ? await getOperators() : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and Control Centre preferences"
      />

      <Separator />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left nav */}
        <aside className="w-full lg:w-48 shrink-0">
          <nav className="flex flex-row gap-1 lg:flex-col">
            {navItems.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Profile */}
          <section id="profile" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">Your operator account details</p>
            </div>
            <Separator />
            <Card>
              <CardContent className="pt-6">
                <ProfileForm
                  currentName={session?.name ?? ''}
                  email={session?.email ?? ''}
                  role={session?.role ?? 'operator'}
                />
              </CardContent>
            </Card>
          </section>

          {/* Operators — super_admin only */}
          <section id="operators" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Operators</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? 'Manage who has access to the Control Centre' : 'Operator access is managed by a Super Admin'}
              </p>
            </div>
            <Separator />
            {isAdmin ? (
              <div className="space-y-4">
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
            ) : (
              <p className="text-sm text-muted-foreground">You do not have permission to manage operators.</p>
            )}
          </section>

          {/* Platform */}
          <section id="platform" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Platform</h2>
              <p className="text-sm text-muted-foreground">Control Centre version and environment</p>
            </div>
            <Separator />
            <Card>
              <CardContent className="pt-6 space-y-3">
                {[
                  { label: 'Application',       value: 'Unami Control Centre' },
                  { label: 'Phase',             value: '18D — Cross-Node Aggregation' },
                  { label: 'Node API Contract', value: 'v1.0' },
                  { label: 'Supabase Project',  value: 'ufsmpqxniswdnsywjzje' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
