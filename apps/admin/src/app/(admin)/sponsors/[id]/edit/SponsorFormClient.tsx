'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { SponsorTier } from '@moments/shared';
import type { Sponsor } from '@moments/api';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const TIERS = Object.values(SponsorTier);

interface Props { sponsor: Sponsor | null; }

export function SponsorFormClient({ sponsor }: Props) {
  const router = useRouter();
  const isEdit = !!sponsor;

  const [form, setForm] = useState({
    name: sponsor?.name ?? '',
    displayName: sponsor?.displayName ?? '',
    contactEmail: sponsor?.contactEmail ?? '',
    logoUrl: sponsor?.logoUrl ?? '',
    websiteUrl: sponsor?.websiteUrl ?? '',
    tier: sponsor?.tier ?? 'bronze',
    monthlyBudget: String(sponsor?.monthlyBudget ?? 0),
    active: sponsor?.active ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      if (isEdit) {
        await api.sponsors.update(sponsor!.id, {
          displayName: form.displayName,
          contactEmail: form.contactEmail || null,
          logoUrl: form.logoUrl || null,
          websiteUrl: form.websiteUrl || null,
          tier: form.tier as typeof TIERS[number],
          monthlyBudget: parseFloat(form.monthlyBudget),
          active: form.active,
        });
      } else {
        await api.sponsors.create({
          name: form.name,
          displayName: form.displayName,
          contactEmail: form.contactEmail || null,
          logoUrl: form.logoUrl || null,
          websiteUrl: form.websiteUrl || null,
          tier: form.tier as typeof TIERS[number],
          monthlyBudget: parseFloat(form.monthlyBudget),
        });
      }
      router.push('/sponsors');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/sponsors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Sponsor' : 'New Sponsor'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="space-y-1">
            <Label htmlFor="name">Slug <span className="text-destructive">*</span></Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="lowercase-slug" pattern="[a-z0-9-]+" />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only. Cannot be changed.</p>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="displayName">Display Name <span className="text-destructive">*</span></Label>
          <Input id="displayName" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tier</Label>
            <Select value={form.tier} onValueChange={(v) => set('tier', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="monthlyBudget">Monthly Budget (ZAR)</Label>
            <Input id="monthlyBudget" type="number" min={0} step={0.01} value={form.monthlyBudget} onChange={(e) => set('monthlyBudget', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input id="websiteUrl" type="url" value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" type="url" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <Switch id="active" checked={form.active} onCheckedChange={(v) => set('active', v)} />
            <Label htmlFor="active">Active</Label>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => router.push('/sponsors')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Sponsor'}</Button>
        </div>
      </form>
    </div>
  );
}
