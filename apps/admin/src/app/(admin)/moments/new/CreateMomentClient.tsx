'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Region, Category, Language, UrgencyLevel } from '@moments/shared';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);
const LANGUAGES = Object.values(Language);
const URGENCY_LEVELS = Object.values(UrgencyLevel);

const fieldClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

export function CreateMomentClient() {
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
    pwaLink: '',
    scheduledAt: '',
  });

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
        pwaLink: form.pwaLink || null,
        scheduledAt: form.scheduledAt || null,
        sponsorId: null,
        mediaUrls: [],
      });
      router.push('/moments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create moment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">New Moment</h1>
        <p className="text-sm text-muted-foreground">Create a draft moment for review and broadcast</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Content</p>
            <p className="text-xs text-muted-foreground mb-3">The message that will be sent to subscribers</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Title <span className="text-destructive">*</span></label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required minLength={3} maxLength={200} placeholder="Enter a clear, descriptive title" className={fieldClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Content <span className="text-destructive">*</span></label>
            <textarea value={form.content} onChange={(e) => set('content', e.target.value)} required minLength={10} maxLength={2000} rows={5} placeholder="Write the moment content (max 2000 characters)" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            <p className="text-xs text-muted-foreground text-right">{form.content.length}/2000</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Classification</p>
            <p className="text-xs text-muted-foreground mb-3">Region, category and urgency targeting</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Region <span className="text-destructive">*</span></label>
              <select value={form.region} onChange={(e) => set('region', e.target.value)} className={fieldClass}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Category <span className="text-destructive">*</span></label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={fieldClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Language <span className="text-destructive">*</span></label>
              <select value={form.language} onChange={(e) => set('language', e.target.value)} className={fieldClass}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Urgency <span className="text-destructive">*</span></label>
              <select value={form.urgencyLevel} onChange={(e) => set('urgencyLevel', e.target.value)} className={fieldClass}>
                {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Publishing</p>
            <p className="text-xs text-muted-foreground mb-3">Where and when this moment will be published</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">PWA Link</label>
            <p className="text-xs text-muted-foreground">Optional deep link to a PWA page</p>
            <input value={form.pwaLink} onChange={(e) => set('pwaLink', e.target.value)} type="url" placeholder="https://..." className={fieldClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Schedule</label>
            <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
            <input value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} type="datetime-local" className={fieldClass} />
          </div>
          <div className="flex flex-col gap-3">
            {[
              { field: 'publishToPwa', label: 'Publish to PWA', checked: form.publishToPwa },
              { field: 'publishToWhatsapp', label: 'Publish to WhatsApp', checked: form.publishToWhatsapp },
              { field: 'isSponsored', label: 'Sponsored content', checked: form.isSponsored },
            ].map(({ field, label, checked }) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={checked} onChange={(e) => set(field, e.target.checked)} className="rounded border-input" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => router.push('/moments')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</Button>
        </div>
      </form>
    </div>
  );
}
