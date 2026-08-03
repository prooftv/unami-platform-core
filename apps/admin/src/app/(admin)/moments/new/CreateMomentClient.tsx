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
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@unami/ui';
import { ArrowLeft } from 'lucide-react';
import { Region, Category, UrgencyLevel } from '@/domain/moments';
import { Language } from '@unami/shared';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { Sponsor } from '@unami/api';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);
const LANGUAGES = Object.values(Language);
const URGENCY_LEVELS = Object.values(UrgencyLevel);

const URGENCY_DESCRIPTIONS: Record<string, string> = {
  low: 'Routine community update',
  medium: 'Notable — elevated visibility',
  high: 'Important — prioritised delivery',
  urgent: 'Critical — immediate broadcast',
};

interface Props { sponsors: Sponsor[]; }

export function CreateMomentClient({ sponsors }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    region: REGIONS[0],
    category: CATEGORIES[0],
    language: Language.ENGLISH,
    urgencyLevel: UrgencyLevel.LOW,
    publishToPwa: true,
    publishToWhatsapp: false,
    isSponsored: false,
    sponsorId: '',
    pwaLink: '',
    scheduledAt: '',
  });

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSponsoredToggle(checked: boolean) {
    setForm((prev) => ({ ...prev, isSponsored: checked, sponsorId: checked ? prev.sponsorId : '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.isSponsored && !form.sponsorId) { setError('Select a sponsor for sponsored content'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.moments.create({
        title: form.title,
        content: form.content,
        region: form.region as typeof REGIONS[number],
        category: form.category as typeof CATEGORIES[number],
        language: form.language,
        urgencyLevel: form.urgencyLevel,
        publishToPwa: form.publishToPwa,
        publishToWhatsapp: form.publishToWhatsapp,
        isSponsored: form.isSponsored,
        sponsorId: form.isSponsored && form.sponsorId ? form.sponsorId : null,
        pwaLink: form.pwaLink || null,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        mediaUrls: [],
      });
      router.push('/moments');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create moment');
    } finally {
      setSaving(false);
    }
  }

  const charCount = form.content.length;
  const charWarning = charCount > 1800;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Moment"
        description="Create a draft moment for review and broadcast"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/moments')}>
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
              <CardHeader><CardTitle>Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    required
                    minLength={3}
                    maxLength={200}
                    placeholder="Enter a clear, descriptive title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => set('content', e.target.value)}
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={7}
                    className="resize-none"
                    placeholder="Write the moment content (max 2000 characters)"
                  />
                  <p className={`text-xs text-right ${charWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount}/2000
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Region <span className="text-destructive">*</span></Label>
                  <Select value={form.region} onValueChange={(v) => set('region', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={(v) => set('language', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label htmlFor="pwaLink">PWA Link</Label>
                  <Input
                    id="pwaLink"
                    value={form.pwaLink}
                    onChange={(e) => set('pwaLink', e.target.value)}
                    type="url"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledAt">Schedule</Label>
                  <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
                  <Input
                    id="scheduledAt"
                    value={form.scheduledAt}
                    onChange={(e) => set('scheduledAt', e.target.value)}
                    type="datetime-local"
                  />
                </div>
                <div className="flex flex-col gap-3 pt-1">
                  {(['publishToPwa', 'publishToWhatsapp'] as const).map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <Switch id={field} checked={form[field]} onCheckedChange={(v) => set(field, v)} />
                      <Label htmlFor={field} className="font-normal">
                        {field === 'publishToPwa' ? 'Publish to PWA' : 'Publish to WhatsApp'}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <Switch id="isSponsored" checked={form.isSponsored} onCheckedChange={handleSponsoredToggle} />
                    <Label htmlFor="isSponsored" className="font-normal">Sponsored content</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {form.isSponsored && (
              <Card>
                <CardHeader><CardTitle>Sponsor Attribution</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
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
                  <p className="text-xs text-muted-foreground">Links revenue attribution and compliance records</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pb-8">
              <Button type="button" variant="outline" onClick={() => router.push('/moments')}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</Button>
            </div>
          </div>

          {/* ── Right column: sticky sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">State</span>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Urgency</span>
                    <span className="font-medium capitalize">{form.urgencyLevel}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-medium">{form.region}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{form.category}</span>
                  </div>
                  {form.scheduledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="font-medium text-xs">
                        {new Date(form.scheduledAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Urgency Guide</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {URGENCY_LEVELS.map((u) => (
                    <div key={u} className={`rounded-md px-2.5 py-2 text-xs ${form.urgencyLevel === u ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}`}>
                      <span className="font-medium capitalize">{u}</span>
                      <span className="block mt-0.5 opacity-80">{URGENCY_DESCRIPTIONS[u]}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Publishing</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">PWA</span> — visible on the public website</p>
                  <p><span className="font-medium text-foreground">WhatsApp</span> — delivered to subscribers</p>
                  <p><span className="font-medium text-foreground">Draft</span> — saved but not broadcast</p>
                  <p><span className="font-medium text-foreground">Scheduled</span> — broadcast at the set time</p>
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
