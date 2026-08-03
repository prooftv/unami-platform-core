'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { createClient } from '@/lib/supabase/client';
import { AuthorityScope, ApprovalMode } from '@unami/shared';
import type { AuthorityProfile } from '@unami/api';
import type { AuthorityAuditEntry } from '@unami/api';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const SCOPES = Object.values(AuthorityScope);
const APPROVAL_MODES = Object.values(ApprovalMode);

interface Props {
  profile: AuthorityProfile | null;
  auditLog?: AuthorityAuditEntry[];
}

export function AuthorityFormClient({ profile, auditLog = [] }: Props) {
  const router = useRouter();
  const isEdit = !!profile;

  const [form, setForm] = useState({
    userIdentifier: profile?.userIdentifier ?? '',
    authorityLevel: String(profile?.authorityLevel ?? 1),
    roleLabel: profile?.roleLabel ?? '',
    scope: profile?.scope ?? SCOPES[0],
    scopeIdentifier: profile?.scopeIdentifier ?? '',
    approvalMode: profile?.approvalMode ?? 'admin_review',
    blastRadius: String(profile?.blastRadius ?? 100),
    riskThreshold: String(profile?.riskThreshold ?? 0.7),
    validUntil: profile?.validUntil ? new Date(profile.validUntil).toISOString().slice(0, 16) : '',
  });

  const [saving, setSaving] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspend, setShowSuspend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const input = {
        userIdentifier: form.userIdentifier,
        authorityLevel: parseInt(form.authorityLevel),
        roleLabel: form.roleLabel,
        scope: form.scope as typeof SCOPES[number],
        scopeIdentifier: form.scopeIdentifier || null,
        approvalMode: form.approvalMode as typeof APPROVAL_MODES[number],
        blastRadius: parseInt(form.blastRadius),
        riskThreshold: parseFloat(form.riskThreshold),
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      };
      if (isEdit) {
        await api.authority.update(profile!.id, input);
      } else {
        await api.authority.create(input);
      }
      router.push('/authority');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend() {
    if (!suspendReason.trim()) { setError('Reason is required'); return; }
    setSuspending(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.authority.suspend(profile!.id, suspendReason);
      router.push('/authority');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Suspend failed');
    } finally {
      setSuspending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/authority')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Authority Profile' : 'New Authority Profile'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="space-y-1">
            <Label htmlFor="userIdentifier">Phone / User Identifier <span className="text-destructive">*</span></Label>
            <Input id="userIdentifier" value={form.userIdentifier} onChange={(e) => set('userIdentifier', e.target.value)} required placeholder="+27..." />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Authority Level</Label>
            <Select value={form.authorityLevel} onValueChange={(v) => set('authorityLevel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map((l) => <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="roleLabel">Role Label <span className="text-destructive">*</span></Label>
            <Input id="roleLabel" value={form.roleLabel} onChange={(e) => set('roleLabel', e.target.value)} required placeholder="Community Leader" />
          </div>
          <div className="space-y-1">
            <Label>Scope</Label>
            <Select value={form.scope} onValueChange={(v) => set('scope', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="scopeIdentifier">Scope Identifier</Label>
            <Input id="scopeIdentifier" value={form.scopeIdentifier} onChange={(e) => set('scopeIdentifier', e.target.value)} placeholder="e.g. KZN" />
          </div>
          <div className="space-y-1">
            <Label>Approval Mode</Label>
            <Select value={form.approvalMode} onValueChange={(v) => set('approvalMode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{APPROVAL_MODES.map((m) => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="blastRadius">Blast Radius</Label>
            <Input id="blastRadius" type="number" min={1} max={10000} value={form.blastRadius} onChange={(e) => set('blastRadius', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="riskThreshold">Risk Threshold (0.1–0.9)</Label>
            <Input id="riskThreshold" type="number" min={0.1} max={0.9} step={0.1} value={form.riskThreshold} onChange={(e) => set('riskThreshold', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input id="validUntil" type="datetime-local" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {isEdit && profile?.status === 'active' && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setShowSuspend(!showSuspend)}>
                Suspend Profile
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/authority')}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Profile'}</Button>
          </div>
        </div>
      </form>

      {showSuspend && (
        <div className="space-y-2 border border-destructive rounded-md p-4">
          <p className="text-sm font-medium text-destructive">Suspend this authority profile</p>
          <Input
            placeholder="Reason for suspension (required)"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={suspending}>
              {suspending ? 'Suspending...' : 'Confirm Suspend'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSuspend(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isEdit && auditLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Audit Log</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Blast Radius</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><span className="text-sm font-medium">{e.actionType}</span></TableCell>
                    <TableCell><span className="text-sm">Level {e.authorityLevel}</span></TableCell>
                    <TableCell><span className="text-sm">{e.blastRadiusApplied.toLocaleString()}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{new Date(e.performedAt).toLocaleString()}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
