import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, FormSection, Card, CardContent, CardHeader, CardTitle } from '@moments/ui';

export default async function SettingsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="System configuration, feature flags and admin user management"
      />

      <FormSection title="System Settings" description="Core platform configuration values">
        <div className="grid grid-cols-1 gap-3">
          {[
            { key: 'monthly_budget', label: 'Monthly Budget (ZAR)', placeholder: 'e.g. 5000' },
            { key: 'message_cost_zar', label: 'Cost per Message (ZAR)', placeholder: 'e.g. 0.05' },
            { key: 'daily_message_limit', label: 'Daily Message Limit', placeholder: 'e.g. 10000' },
            { key: 'warning_threshold_percent', label: 'Budget Warning Threshold (%)', placeholder: 'e.g. 80' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-4">
              <label className="text-sm font-medium w-56 shrink-0">{label}</label>
              <input
                disabled
                placeholder={placeholder}
                className="h-9 flex-1 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">System settings are managed via the Supabase dashboard until the settings API client is connected.</p>
      </FormSection>

      <FormSection title="Feature Flags" description="Enable or disable platform features">
        <div className="grid grid-cols-1 gap-3">
          {[
            'whatsapp_broadcasting',
            'pwa_publishing',
            'ai_moderation',
            'campaign_module',
            'authority_system',
          ].map((flag) => (
            <div key={flag} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-mono">{flag}</span>
              <span className="text-xs text-muted-foreground">Managed via Supabase</span>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Admin Users" description="Manage admin role assignments">
        <Card>
          <CardHeader><CardTitle>Current Session</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Email: <span className="font-medium">{session.email}</span></p>
            <p>Role: <span className="font-medium">{session.role}</span></p>
            <p>ID: <span className="font-mono text-xs text-muted-foreground">{session.id}</span></p>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">Admin user management is done via the Supabase dashboard → admin_roles table until the admin users API client is connected.</p>
      </FormSection>
    </div>
  );
}
