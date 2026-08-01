import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin') redirect('/dashboard');

  const api = await getApiClient();
  const [metrics, flags, systemSettings] = await Promise.all([
    api ? api.analytics.dashboardMetrics().catch(() => null) : null,
    api ? api.settings.listFlags().catch(() => []) : [],
    api ? api.settings.listSystemSettings().catch(() => []) : [],
  ]);

  return (
    <SettingsClient
      session={session!}
      metrics={metrics}
      flags={flags ?? []}
      systemSettings={systemSettings ?? []}
    />
  );
}
