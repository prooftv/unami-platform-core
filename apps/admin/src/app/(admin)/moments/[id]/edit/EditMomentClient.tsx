'use client';

import { useState, useTransition } from 'react';
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
import type { MomentWithSponsor, Sponsor } from '@unami/api';
import { updateMomentAction, scheduleMomentAction } from '../../_actions/moment-actions';
import { STATUS_VARIANT, URGENCY_DESCRIPTIONS } from '../../_lib/moment-utils';

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
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<'save' | 'schedule' | null>(null);
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

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.isSponsored && !form.sponsorId) { setError('Select a sponsor for sponsored content'); return; }
    setError(null);
    setPendingAction('save');
    startTransition(async () => {
      const res = await updateMomentAction(moment.id, {
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
      setPendingAction(null);
      if (res.error) { setError(res.error); return; }
      router.push(`/moments/${moment.id}`);
    });
  }

  function handleSchedule() {
    if (!form.scheduledAt) { setError('Select a date and time to schedule'); return; }
    if (moment.status !== 'draft') { setError('Only draft moments can be scheduled'); return; }
    setError(null);
    setPendingAction('schedule');
    startTransition(async () => {
      const res = await scheduleMomentAction(moment.id, new Date(form.scheduledAt).toISOString());
      setPendingAction(null);
      if (res.error) { setError(res.error); return; }
      router.push(`/moments/${moment.id}`);
    });
  }

  const charCount = form.content.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Moment"
        description={moment.title}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/moments/${moment.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required minLength={3} maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
                  <Textarea id="content" value={form.content} onChange={(e) => set('content', e.target.value)} required minLength={10} maxLength={2000} rows={7} className="resize-none" />
                  <p className={`text-xs text-right ${charCount > 1800 ? 'text-destructive' : 'text-muted-foreground'}`}>{charCount}/2000</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Region</Label>
                  <Select value={form.region} onValueChange={(v) => set('region', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
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
                  <Input id="pwaLink" value={form.pwaLink} onChange={(e) => set('pwaLink', e.target.value)} type="url" placeholder="https://..." />
                </div>
                {moment.status === 'draft' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduledAt">Schedule for</Label>
                    <Input id="scheduledAt" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} type="datetime-local" />
                  </div>
                )}
                <div className="flex flex-col gap-3 pt-1">
                  {(['publishToPwa', 'publishToWhatsapp'] as const).map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <Switch id={field} checked={form[field]} onCheckedChange={(v) => set(field, v)} />
                      <Label htmlFor={field} className="font-normal">{field === 'publishToPwa' ? 'Publish to PWA' : 'Publish to WhatsApp'}</Label>
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <Switch id="isSponsored" checked={form.isSponsored} onCheckedChange={(v) => setForm((p) => ({ ...p, isSponsored: v, sponsorId: v ? p.sponsorId : '' }))} />
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
                        : sponsors.map((s) => <SelectItem key={s.id} value={s.id}>{s.displayName} ({s.tier})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Links revenue attribution and compliance records</p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pb-8">
              <Button type="button" variant="outline" onClick={() => router.push(`/moments/${moment.id}`)}>Cancel</Button>
              {moment.status === 'draft' && form.scheduledAt && (
                <Button type="button" variant="secondary" onClick={handleSchedule} disabled={isPending && pendingAction === 'schedule'}>
                  {isPending && pendingAction === 'schedule' ? 'Scheduling...' : 'Save & Schedule'}
                </Button>
              )}
              <Button type="submit" disabled={isPending && pendingAction === 'save'}>
                {isPending && pendingAction === 'save' ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'State', value: <Badge variant={STATUS_VARIANT[moment.status] ?? 'secondary'} className="capitalize">{moment.status}</Badge> },
                    { label: 'Urgency', value: <span className="font-medium capitalize">{form.urgencyLevel}</span> },
                    { label: 'Region', value: <span className="font-medium">{form.region}</span> },
                    { label: 'Category', value: <span className="font-medium">{form.category}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      {value}
                    </div>
                  ))}
                  {moment.broadcastedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Broadcast</span>
                      <span className="text-xs font-medium">{new Date(moment.broadcastedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  {form.scheduledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="text-xs font-medium">{new Date(form.scheduledAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
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

              {moment.status === 'broadcasted' && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="pt-4">
                    <p className="text-xs text-destructive font-medium">Broadcasted moments are immutable</p>
                    <p className="text-xs text-muted-foreground mt-1">Content, region, and category cannot be changed after broadcast.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
