'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminSession, DashboardMetrics, FeatureFlag, SystemSetting } from '@moments/api';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { Database, Zap, HardDrive, Wifi, Send, Users, Radio, Megaphone } from 'lucide-react';

interface Props {
  session: AdminSession;
  metrics: DashboardMetrics | null;
  flags: FeatureFlag[];
  systemSettings: SystemSetting[];
}

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

export function SettingsClient({ session, metrics, flags: initialFlags, systemSettings: initialSettings }: Props) {
  const [flags, setFlags] = useState(initialFlags);
  const [settings, setSettings] = useState(initialSettings);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const isSuperadmin = session.role === 'superadmin';
  const intentHealthy = metrics?.systemStatus.intentSystem === 'healthy';
  const lastUpdated = metrics?.systemStatus.lastUpdated ? new Date(metrics.systemStatus.lastUpdated).toLocaleString() : null;

  const services = [
    { label: 'Database', icon: Database, healthy: metrics ? true : null },
    { label: 'Auth Service', icon: Zap, healthy: metrics ? true : null },
    { label: 'Storage', icon: HardDrive, healthy: metrics ? true : null },
    { label: 'Realtime', icon: Wifi, healthy: metrics ? true : null },
    { label: 'Edge Functions', icon: Send, healthy: metrics ? intentHealthy : null },
  ];

  const kpis = [
    { title: 'Total Moments', value: metrics?.totalMoments ?? '—', description: 'In database', icon: Radio },
    { title: 'Total Broadcasts', value: metrics?.totalBroadcasts ?? '—', description: 'All time', icon: Megaphone },
    { title: 'Active Subscribers', value: metrics?.activeSubscribers ?? '—', description: 'Opted in', icon: Users },
    { title: 'Delivery Rate', value: metrics?.successRate ?? '—', description: 'All time', icon: Zap },
  ];

  async function toggleFlag(flagKey: string, current: boolean) {
    if (!isSuperadmin) return;
    setToggling(flagKey);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const updated = await api.settings.updateFlag(flagKey, !current);
      setFlags((prev) => prev.map((f) => f.flagKey === flagKey ? updated : f));
      setFeedback({ msg: `${flagKey} ${updated.enabled ? 'enabled' : 'disabled'}`, ok: true });
    } catch (e) {
      setFeedback({ msg: e instanceof Error ? e.message : 'Failed', ok: false });
    } finally {
      setToggling(null);
    }
  }

  function startEdit(key: string, value: string) {
    setEditing(key);
    setEditValue(value);
    setFeedback(null);
  }

  async function saveEdit(settingKey: string) {
    setSaving(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const updated = await api.settings.updateSystemSetting(settingKey, editValue);
      setSettings((prev) => prev.map((s) => s.settingKey === settingKey ? updated : s));
      setEditing(null);
      setFeedback({ msg: `${settingKey} updated`, ok: true });
    } catch (e) {
      setFeedback({ msg: e instanceof Error ? e.message : 'Failed', ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">System status, feature flags, platform configuration and session information</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{feedback.msg}</p>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.map(({ label, icon: Icon, healthy }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </div>
              {healthy === null
                ? <Badge variant="secondary">Checking…</Badge>
                : healthy
                ? <Badge variant="default">Healthy</Badge>
                : <Badge variant="destructive">Degraded</Badge>
              }
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feature Flags</CardTitle>
            {!isSuperadmin && <span className="text-xs text-muted-foreground">Read-only</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feature flags configured</p>
          ) : flags.map((flag) => (
            <div key={flag.flagKey} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-mono text-xs font-medium">{flag.flagKey}</p>
                {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
              </div>
              {isSuperadmin ? (
                <button
                  onClick={() => toggleFlag(flag.flagKey, flag.enabled)}
                  disabled={toggling === flag.flagKey}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${flag.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  role="switch"
                  aria-checked={flag.enabled}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${flag.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              ) : (
                <Badge variant={flag.enabled ? 'default' : 'outline'}>{flag.enabled ? 'enabled' : 'disabled'}</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Settings</CardTitle>
            {!isSuperadmin && <span className="text-xs text-muted-foreground">Read-only</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No system settings configured</p>
          ) : settings.map((s) => (
            <div key={s.settingKey} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono text-xs font-medium">{s.settingKey}</p>
                  {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                </div>
                {isSuperadmin && editing !== s.settingKey ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.settingValue}</span>
                    <button onClick={() => startEdit(s.settingKey, s.settingValue)} className="text-xs text-primary underline hover:no-underline">Edit</button>
                  </div>
                ) : !isSuperadmin ? (
                  <span className="font-medium">{s.settingValue}</span>
                ) : null}
              </div>
              {editing === s.settingKey && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-8 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button onClick={() => saveEdit(s.settingKey)} disabled={saving} className="h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="h-8 rounded-md border px-3 text-xs hover:bg-accent">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Session</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="default">{session.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{session.id}</span>
          </div>
          {session.authority_id && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Authority ID</span>
              <span className="font-mono text-xs text-muted-foreground">{session.authority_id}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
