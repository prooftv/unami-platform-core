'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, FormSection, FieldGroup, SubmitBar, Button } from '@moments/ui';
import { Region, Category, Language, UrgencyLevel } from '@moments/shared';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);
const LANGUAGES = Object.values(Language);
const URGENCY_LEVELS = Object.values(UrgencyLevel);

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
      const api = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
        token,
      });
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
    <div className="p-6 max-w-2xl space-y-6">
      <PageHeader
        title="New Moment"
        description="Create a draft moment for review and broadcast"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection title="Content" description="The message that will be sent to subscribers">
          <FieldGroup label="Title" required>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required minLength={3} maxLength={200}
              placeholder="Enter a clear, descriptive title"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FieldGroup>

          <FieldGroup label="Content" required>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              required minLength={10} maxLength={2000}
              rows={5}
              placeholder="Write the moment content (max 2000 characters)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.content.length}/2000</p>
          </FieldGroup>
        </FormSection>

        <FormSection title="Classification" description="Region, category and urgency targeting">
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Region" required>
              <select
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FieldGroup>

            <FieldGroup label="Category" required>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldGroup>

            <FieldGroup label="Language" required>
              <select
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </FieldGroup>

            <FieldGroup label="Urgency" required>
              <select
                value={form.urgencyLevel}
                onChange={(e) => set('urgencyLevel', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </FieldGroup>
          </div>
        </FormSection>

        <FormSection title="Publishing" description="Where and when this moment will be published">
          <FieldGroup label="PWA Link" description="Optional deep link to a PWA page">
            <input
              value={form.pwaLink}
              onChange={(e) => set('pwaLink', e.target.value)}
              type="url"
              placeholder="https://..."
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FieldGroup>

          <FieldGroup label="Schedule" description="Leave empty to save as draft">
            <input
              value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              type="datetime-local"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.publishToPwa}
                onChange={(e) => set('publishToPwa', e.target.checked)}
                className="rounded border-input"
              />
              Publish to PWA
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.publishToWhatsapp}
                onChange={(e) => set('publishToWhatsapp', e.target.checked)}
                className="rounded border-input"
              />
              Publish to WhatsApp
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSponsored}
                onChange={(e) => set('isSponsored', e.target.checked)}
                className="rounded border-input"
              />
              Sponsored content
            </label>
          </div>
        </FormSection>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <SubmitBar>
          <Button type="button" variant="outline" onClick={() => router.push('/moments')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
        </SubmitBar>
      </form>
    </div>
  );
}
