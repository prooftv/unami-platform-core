'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@unami/ui';
import { ArrowLeft } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { SponsorTier } from '@/domain/moments';
import type { Sponsor } from '@unami/api';

const TIERS = Object.values(SponsorTier);

const TIER_DESCRIPTIONS: Record<string, string> = {
  bronze: 'Local community support',
  silver: 'Category-level sponsorship',
  gold: 'Regional content support',
  platinum: 'National platform partner',
};

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
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Sponsor' : 'New Sponsor'}
        description={isEdit ? `${sponsor!.displayName} · ${sponsor!.tier}` : 'Add a new sponsor to the platform'}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/sponsors')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">

          {/* ── Left column: form cards ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Slug <span className="text-destructive">*</span></Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      required
                      placeholder="lowercase-slug"
                      pattern="[a-z0-9-]+"
                    />
                    <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only. Cannot be changed.</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="displayName">Display Name <span className="text-destructive">*</span></Label>
                  <Input id="displayName" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Commercial</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tier</Label>
                  <Select value={form.tier} onValueChange={(v) => set('tier', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthlyBudget">Monthly Budget (ZAR)</Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.monthlyBudget}
                    onChange={(e) => set('monthlyBudget', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact & Links</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input id="websiteUrl" type="url" value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" type="url" value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://..." />
                  {form.logoUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logoUrl} alt="Logo preview" className="h-8 w-8 rounded object-contain border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="text-xs text-muted-foreground">Logo preview</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isEdit && (
              <Card>
                <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Switch id="active" checked={form.active} onCheckedChange={(v) => set('active', v)} />
                    <Label htmlFor="active" className="font-normal">Active</Label>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Inactive sponsors cannot be assigned to new moments or campaigns.</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pb-8">
              <Button type="button" variant="outline" onClick={() => router.push('/sponsors')}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Sponsor'}</Button>
            </div>
          </div>

          {/* ── Right column: sticky sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isEdit && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={form.active ? 'default' : 'secondary'}>
                        {form.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-medium capitalize">{form.tier}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">R {parseFloat(form.monthlyBudget || '0').toFixed(2)}/mo</span>
                  </div>
                  {form.displayName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{form.displayName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Tier Guide</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {TIERS.map((t) => (
                    <div key={t} className={`rounded-md px-2.5 py-2 text-xs ${form.tier === t ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                      <span className="font-medium capitalize">{t}</span>
                      <span className="block mt-0.5 opacity-80">{TIER_DESCRIPTIONS[t]}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
