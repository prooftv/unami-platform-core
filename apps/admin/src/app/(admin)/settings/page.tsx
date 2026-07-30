import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  // Settings and feature flags are read from system_settings and feature_flags tables
  // via the analytics dashboard metrics endpoint (which includes system status)
  // Full settings CRUD is Phase 6E scope — read-only display here
  const api = await getApiClient();
  const metrics = api ? await api.analytics.dashboardMetrics().catch(() => null) : null;

  return <SettingsClient session={session} metrics={metrics} />;
}
