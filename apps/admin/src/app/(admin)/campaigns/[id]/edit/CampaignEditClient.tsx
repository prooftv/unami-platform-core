'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { Region, Category } from '@moments/shared';
import type { CampaignWithSponsor, Sponsor } from '@moments/api';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

interface Props {
  campaign: CampaignWithSponsor;
  sponsors: Sponsor[];
}

export function CampaignEditClient({ campaign, sponsors }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: campaign.title,
    content: campaign.content,
    category: campaign.category,
    sponsorId: campaign.sponsorId ?? '',
    budget: String(campaign.budget),
    targetRegions: campaign.targetRegions as string[],
    scheduledAt: campaign.scheduledAt
      ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
      : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRegion(region: string) {
    setForm((prev) => ({
      ...prev,
      targetRegions: prev.targetRegions.includes(region)
        ? prev.targetRegions.filter((r) => r !== region)
        : [...prev.targetRegions, region],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.targetRegions.length === 0) { setError('Select at least one target region'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.campaigns.update(campaign.id, {
        title: form.title,
        content: form.content,
        category: form.category as typeof CATEGORIES[number],
        sponsorId: form.sponsorId || null,
        budget: parseFloat(form.budget),
        targetRegions: form.targetRegions as typeof REGIONS[number][],
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      });
      router.push(`/campaigns/${campaign.id}`);
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
        <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/${campaign.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-lg font-semibold">Edit Campaign</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
          <Textarea id="content" value={form.content} onChange={(e) => set('content', e.target.value)} required minLength={10} maxLength={2000} rows={4} className="resize-none" />
          <p className="text-xs text-muted-foreground text-right">{form.content.length}/2000</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Sponsor</Label>
            <Select value={form.sponsorId} onValueChange={(v) => set('sponsorId', v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {sponsors.map((s) => <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="budget">Budget (ZAR)</Label>
            <Input id="budget" type="number" min={0} step={0.01} value={form.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scheduledAt">Schedule</Label>
            <Input id="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Target Regions <span className="text-destructive">*</span></Label>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRegion(r)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${form.targetRegions.includes(r) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => router.push(`/campaigns/${campaign.id}`)}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}
