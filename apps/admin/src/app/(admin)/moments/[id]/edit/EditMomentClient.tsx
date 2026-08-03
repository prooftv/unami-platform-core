'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@unami/ui';
import { ArrowLeft } from 'lucide-react';
import { Region, Category, Language, UrgencyLevel } from '@unami/shared';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { MomentWithSponsor, Sponsor } from '@unami/api';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);
const LANGUAGES = Object.values(Language);
const URGENCY_LEVELS = Object.values(UrgencyLevel);

interface Props {
  moment: MomentWithSponsor;
  sponsors: Sponsor[];
}

export function EditMomentClient({ moment, sponsors }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: moment.title,
    content: moment.content,
    region: moment.region,
    category: moment.category,
    language: moment.language,
    urgencyLevel: moment.urgencyLevel,
    publishToPwa: moment.publishToPwa,
    publishToWhatsapp: moment.publishToWhatsapp,
    isSponsored: moment.isSponsored,
    sponsorId: moment.sponsorId ?? '',
    pwaLink: moment.pwaLink ?? '',
    scheduledAt: moment.scheduledAt ? new Date(moment.scheduledAt).toISOString().slice(0, 16) : '',
  });

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSponsoredToggle(checked: boolean) {
    setForm((prev) => ({ ...prev, isSponsored: checked, sponsorId: checked ? prev.sponsorId : '' }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.isSponsored && !form.sponsorId) { setError('Select a sponsor for sponsored content'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.moments.update(moment.id, {
        title: form.title,
        content: form.content,
        region: form.region,
        category: form.category,
        language: form.language,
        urgencyLevel: form.urgencyLevel,
        publishToPwa: form.publishToPwa,
        publishToWhatsapp: form.publishToWhatsapp,
        isSponsored: form.isSponsored,
        sponsorId: form.isSponsored && form.sponsorId ? form.sponsorId : null,
        pwaLink: form.pwaLink || null,
      });
      router.push(`/moments/${moment.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!form.scheduledAt) { setError('Select a date and time to schedule'); return; }
    if (moment.status !== 'draft') { setError('Only draft moments can be scheduled'); return; }
    setScheduling(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.moments.schedule(moment.id, { scheduledAt: new Date(form.scheduledAt).toISOString() });
      router.push(`/moments/${moment.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setScheduling(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Moment"
        description={`Status: ${moment.status}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/moments/${moment.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSave}>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader><CardTitle>Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required minLength={3} maxLength={200} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
                <Textarea id="content" value={form.content} onChange={(e) => set('content', e.target.value)} required minLength={10} maxLength={2000} rows={5} className="resize-none" />
                <p className="text-xs text-muted-foreground text-right">{form.content.length}/2000</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => set('region', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => set('language', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Urgency</Label>
                <Select value={form.urgencyLevel} onValueChange={(v) => set('urgencyLevel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{URGENCY_LEVELS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="pwaLink">PWA Link</Label>
                <Input id="pwaLink" value={form.pwaLink} onChange={(e) => set('pwaLink', e.target.value)} type="url" placeholder="https://..." />
              </div>
              {moment.status === 'draft' && (
                <div className="space-y-1">
                  <Label htmlFor="scheduledAt">Schedule for</Label>
                  <Input id="scheduledAt" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} type="datetime-local" />
                </div>
              )}
              <div className="flex flex-col gap-3">
                {(['publishToPwa', 'publishToWhatsapp'] as const).map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Switch id={field} checked={form[field]} onCheckedChange={(v) => set(field, v)} />
                    <Label htmlFor={field}>{field === 'publishToPwa' ? 'Publish to PWA' : 'Publish to WhatsApp'}</Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Switch id="isSponsored" checked={form.isSponsored} onCheckedChange={handleSponsoredToggle} />
                  <Label htmlFor="isSponsored">Sponsored content</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {form.isSponsored && (
            <Card>
              <CardHeader><CardTitle>Sponsor Attribution</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <Label>Sponsor <span className="text-destructive">*</span></Label>
                <Select value={form.sponsorId} onValueChange={(v) => set('sponsorId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select a sponsor" /></SelectTrigger>
                  <SelectContent>
                    {sponsors.length === 0
                      ? <SelectItem value="" disabled>No active sponsors</SelectItem>
                      : sponsors.map((s) => <SelectItem key={s.id} value={s.id}>{s.displayName} ({s.tier})</SelectItem>)
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Required for sponsored moments — links revenue attribution and compliance records</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/moments/${moment.id}`)}>Cancel</Button>
            {moment.status === 'draft' && form.scheduledAt && (
              <Button type="button" variant="secondary" onClick={handleSchedule} disabled={scheduling}>
                {scheduling ? 'Scheduling...' : 'Save & Schedule'}
              </Button>
            )}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
