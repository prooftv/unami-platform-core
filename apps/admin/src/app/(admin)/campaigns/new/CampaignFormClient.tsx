'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@unami/ui';
import { ArrowLeft } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { Region, Category, CampaignType, CAMPAIGN_TYPE_LABELS } from '@/domain/moments';
import type { Sponsor } from '@unami/api';

const REGIONS = Object.values(Region);
const CATEGORIES = Object.values(Category);
const CAMPAIGN_TYPES = Object.values(CampaignType);

interface Props { sponsors: Sponsor[]; }

export function CampaignFormClient({ sponsors }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: CATEGORIES[0],
    sponsorId: '',
    budget: '0',
    targetRegions: [] as string[],
    scheduledAt: '',
    campaignType: CampaignType.AD as CampaignType,
    projectReference: '',
    fundingSource: '',
    contractor: '',
    beneficiaries: '',
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
      await api.campaigns.create({
        title: form.title,
        content: form.content,
        category: form.category as typeof CATEGORIES[number],
        sponsorId: form.sponsorId || null,
        budget: parseFloat(form.budget),
        targetRegions: form.targetRegions as typeof REGIONS[number][],
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        campaignType: form.campaignType,
        projectReference: form.projectReference || null,
        fundingSource: form.fundingSource || null,
        contractor: form.contractor || null,
        beneficiaries: form.beneficiaries ? parseInt(form.beneficiaries) : null,
      });
      router.push('/campaigns');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const charCount = form.content.length;
  const selectedSponsor = sponsors.find((s) => s.id === form.sponsorId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Campaign"
        description="Create a campaign for sponsor review and approval"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/campaigns')}>
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
                  <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
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
                    rows={6}
                    className="resize-none"
                  />
                  <p className={`text-xs text-right ${charCount > 1800 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount}/2000
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Campaign Type</Label>
                  <Select value={form.campaignType} onValueChange={(v) => set('campaignType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
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
                  <Label>Sponsor</Label>
                  <Select value={form.sponsorId} onValueChange={(v) => set('sponsorId', v)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {sponsors.map((s) => <SelectItem key={s.id} value={s.id}>{s.displayName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="budget">Budget (ZAR)</Label>
                  <Input id="budget" type="number" min={0} step={0.01} value={form.budget} onChange={(e) => set('budget', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledAt">Schedule</Label>
                  <Input id="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {form.campaignType === CampaignType.CSR && (
              <Card>
                <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="projectReference">Project Reference</Label>
                    <Input id="projectReference" value={form.projectReference} onChange={(e) => set('projectReference', e.target.value)} placeholder="PRJ-2025-0001" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fundingSource">Funding Source</Label>
                    <Input id="fundingSource" value={form.fundingSource} onChange={(e) => set('fundingSource', e.target.value)} placeholder="e.g. MIG, WSIG" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contractor">Contractor</Label>
                    <Input id="contractor" value={form.contractor} onChange={(e) => set('contractor', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="beneficiaries">Beneficiaries</Label>
                    <Input id="beneficiaries" type="number" min={0} value={form.beneficiaries} onChange={(e) => set('beneficiaries', e.target.value)} placeholder="Community members impacted" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Target Regions <span className="text-destructive">*</span></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.targetRegions.includes(r)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {form.targetRegions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one region</p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pb-8">
              <Button type="button" variant="outline" onClick={() => router.push('/campaigns')}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Campaign'}</Button>
            </div>
          </div>

          {/* ── Right column: sticky sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{CAMPAIGN_TYPE_LABELS[form.campaignType]}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">Pending Review</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{form.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">R {parseFloat(form.budget || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Regions</span>
                    <span className="font-medium">{form.targetRegions.length || '—'}</span>
                  </div>
                  {selectedSponsor && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sponsor</span>
                      <span className="font-medium">{selectedSponsor.displayName}</span>
                    </div>
                  )}
                  {form.scheduledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled</span>
                      <span className="text-xs font-medium">
                        {new Date(form.scheduledAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Approval Flow</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">Pending Review</span> — awaiting admin approval</p>
                  <p><span className="font-medium text-foreground">Approved</span> — ready to activate</p>
                  <p><span className="font-medium text-foreground">Active</span> — moments being broadcast</p>
                  <p><span className="font-medium text-foreground">Completed</span> — budget exhausted or end date reached</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Target Regions</CardTitle></CardHeader>
                <CardContent>
                  {form.targetRegions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No regions selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {form.targetRegions.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
