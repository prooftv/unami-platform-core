'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@unami/ui';
import { Pencil, CheckCircle } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { PROJECT_HEALTH_LABELS } from '@/domain/moments/enums';
import type { CampaignWithSponsor, AdminSession, BudgetTransaction, ProgressLogEntry, CertifiedDeliverable } from '@unami/api';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending_review: 'secondary', approved: 'outline', active: 'default',
  paused: 'secondary', completed: 'outline', cancelled: 'destructive', published: 'default',
};

interface Props {
  campaign: CampaignWithSponsor;
  transactions: BudgetTransaction[];
  progressLog: ProgressLogEntry[];
  deliverables: CertifiedDeliverable[];
  session: AdminSession;
}

export function CampaignDetailClient({ campaign, transactions, progressLog: initialProgress, deliverables: initialDeliverables, session }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Progress log state
  const [progress, setProgress] = useState<ProgressLogEntry[]>(initialProgress);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [addingProgress, setAddingProgress] = useState(false);

  // Deliverables state
  const [deliverables, setDeliverables] = useState<CertifiedDeliverable[]>(initialDeliverables);
  const [delivTask, setDelivTask] = useState('');
  const [delivCertifiedBy, setDelivCertifiedBy] = useState('');
  const [delivPct, setDelivPct] = useState('');
  const [delivNotes, setDelivNotes] = useState('');
  const [certifying, setCertifying] = useState(false);

  // Complete action state
  const [showComplete, setShowComplete] = useState(false);
  const [impactSummary, setImpactSummary] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [completing, setCompleting] = useState(false);

  const isSuperadmin = session.role === 'superadmin';
  const canEdit = (isSuperadmin || session.role === 'content_admin') && campaign.status !== 'completed' && campaign.status !== 'cancelled';
  const canApprove = isSuperadmin && (campaign.status === 'pending_review' || campaign.status === 'paused');
  const canPause = (isSuperadmin || session.role === 'content_admin') && campaign.status === 'active';
  const canCancel = isSuperadmin && campaign.status !== 'completed' && campaign.status !== 'cancelled';
  const isCSR = campaign.campaignType === 'csr';
  const canComplete = isSuperadmin && isCSR && campaign.status === 'active';

  const totalSpent = transactions.filter((t) => t.transactionType === 'spend' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const utilPct = campaign.budget > 0 ? Math.round((totalSpent / campaign.budget) * 100) : 0;

  function getApi(token: string) {
    return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
  }

  async function doAction(action: 'approve' | 'pause' | 'cancel') {
    if (action === 'cancel' && !confirm('Cancel this campaign?')) return;
    setActing(true);
    setError(null);
    try {
      const token = await getToken();
      const api = getApi(token);
      if (action === 'approve') await api.campaigns.approve(campaign.id);
      else if (action === 'pause') await api.campaigns.pause(campaign.id);
      else await api.campaigns.cancel(campaign.id);
      setFeedback(`Campaign ${action}d`);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  async function handleAddProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!progressUpdate.trim()) return;
    setAddingProgress(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await getApi(token).campaigns.addProgress(campaign.id, { update: progressUpdate.trim() });
      setProgress(updated);
      setProgressUpdate('');
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add progress entry');
    } finally {
      setAddingProgress(false);
    }
  }

  async function handleCertify(e: React.FormEvent) {
    e.preventDefault();
    if (!delivTask.trim() || !delivCertifiedBy.trim() || !delivPct) return;
    setCertifying(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await getApi(token).campaigns.certifyDeliverable(campaign.id, {
        task: delivTask.trim(),
        certifiedBy: delivCertifiedBy.trim(),
        percentageComplete: Number(delivPct),
        notes: delivNotes.trim() || undefined,
      });
      setDeliverables(updated);
      setDelivTask(''); setDelivCertifiedBy(''); setDelivPct(''); setDelivNotes('');
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to certify deliverable');
    } finally {
      setCertifying(false);
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!impactSummary.trim() || !lessonsLearned.trim()) return;
    setCompleting(true);
    setError(null);
    try {
      const token = await getToken();
      await getApi(token).campaigns.complete(campaign.id, {
        impactSummary: impactSummary.trim(),
        lessonsLearned: lessonsLearned.trim(),
      });
      setFeedback('Campaign marked complete');
      setShowComplete(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete campaign');
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.title}
        description={`${campaign.category} · ${campaign.sponsor?.displayName ?? 'No sponsor'}`}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />Edit
              </Button>
            )}
            {canApprove && <Button size="sm" onClick={() => doAction('approve')} disabled={acting}>Approve</Button>}
            {canPause && <Button size="sm" variant="secondary" onClick={() => doAction('pause')} disabled={acting}>Pause</Button>}
            {canComplete && <Button size="sm" variant="outline" onClick={() => setShowComplete(true)} disabled={acting}><CheckCircle className="h-4 w-4 mr-2" />Complete</Button>}
            {canCancel && <Button size="sm" variant="destructive" onClick={() => doAction('cancel')} disabled={acting}>Cancel</Button>}
          </div>
        }
      />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {showComplete && (
        <Card className="max-w-3xl border-primary">
          <CardHeader><CardTitle>Complete Campaign</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleComplete} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="impact-summary">Impact Summary <span className="text-destructive">*</span></Label>
                <Textarea id="impact-summary" value={impactSummary} onChange={(e) => setImpactSummary(e.target.value)} rows={3} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lessons-learned">Lessons Learned <span className="text-destructive">*</span></Label>
                <Textarea id="lessons-learned" value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} rows={3} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={completing}>{completing ? 'Saving...' : 'Mark Complete'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowComplete(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={STATUS_VARIANT[campaign.status]}>{campaign.status.replace('_', ' ')}</Badge>
              <p className="text-muted-foreground">Budget: <span className="font-medium text-foreground">R{campaign.budget.toLocaleString()}</span></p>
              <p className="text-muted-foreground">Spent: <span className="font-medium text-foreground">R{totalSpent.toLocaleString()} ({utilPct}%)</span></p>
              {campaign.scheduledAt && (
                <p className="text-muted-foreground">Scheduled: <span className="font-medium text-foreground">{new Date(campaign.scheduledAt).toLocaleString()}</span></p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Targeting</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Regions</p>
                <div className="flex flex-wrap gap-1">{campaign.targetRegions.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</div>
              </div>
              {campaign.targetCategories.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Categories</p>
                  <div className="flex flex-wrap gap-1">{campaign.targetCategories.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{campaign.content}</p></CardContent>
        </Card>

        {isCSR && (
          <Card>
            <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {campaign.projectHealth && (
                <div>
                  <p className="text-muted-foreground">Health</p>
                  <Badge variant={campaign.projectHealth === 'green' ? 'default' : campaign.projectHealth === 'amber' ? 'secondary' : 'destructive'}>
                    {PROJECT_HEALTH_LABELS[campaign.projectHealth]}
                  </Badge>
                </div>
              )}
              {campaign.projectPhase && (
                <div>
                  <p className="text-muted-foreground">Phase</p>
                  <p className="font-medium capitalize">{campaign.projectPhase}</p>
                </div>
              )}
              {campaign.projectReference && (
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{campaign.projectReference}</p>
                </div>
              )}
              {campaign.fundingSource && (
                <div>
                  <p className="text-muted-foreground">Funding Source</p>
                  <p className="font-medium">{campaign.fundingSource}</p>
                </div>
              )}
              {campaign.contractor && (
                <div>
                  <p className="text-muted-foreground">Contractor</p>
                  <p className="font-medium">{campaign.contractor}</p>
                </div>
              )}
              {campaign.beneficiaries != null && (
                <div>
                  <p className="text-muted-foreground">Beneficiaries</p>
                  <p className="font-medium">{campaign.beneficiaries.toLocaleString()}</p>
                </div>
              )}
              {campaign.impactSummary && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Impact Summary</p>
                  <p className="whitespace-pre-wrap">{campaign.impactSummary}</p>
                </div>
              )}
              {campaign.lessonsLearned && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Lessons Learned</p>
                  <p className="whitespace-pre-wrap">{campaign.lessonsLearned}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isCSR && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Progress Log
                {progress.length > 0 && <Badge variant="secondary" className="ml-auto">{progress.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">No progress entries recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {progress.map((entry, i) => (
                    <li key={i} className="rounded-md border px-3 py-2 text-sm">
                      <p className="font-medium">{entry.update}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.date} · {entry.addedBy}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <form onSubmit={handleAddProgress} className="space-y-3 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="progress-update">Update <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="progress-update"
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      rows={2}
                      required
                      placeholder="Describe progress made..."
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={addingProgress}>
                    {addingProgress ? 'Saving...' : 'Add Entry'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {isCSR && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Certified Deliverables
                {deliverables.length > 0 && <Badge variant="secondary" className="ml-auto">{deliverables.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">No deliverables certified yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Complete</TableHead>
                      <TableHead>Certified By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverables.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">{d.task}</TableCell>
                        <TableCell className="text-sm">{d.percentageComplete}%</TableCell>
                        <TableCell className="text-sm">{d.certifiedBy}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === 'certified' ? 'default' : d.status === 'disputed' ? 'destructive' : 'secondary'}>
                            {d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {canEdit && (
                <form onSubmit={handleCertify} className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="deliv-task">Task <span className="text-destructive">*</span></Label>
                      <Input id="deliv-task" value={delivTask} onChange={(e) => setDelivTask(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliv-certified-by">Certified By <span className="text-destructive">*</span></Label>
                      <Input id="deliv-certified-by" value={delivCertifiedBy} onChange={(e) => setDelivCertifiedBy(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliv-pct">% Complete <span className="text-destructive">*</span></Label>
                      <Input id="deliv-pct" type="number" min={0} max={100} value={delivPct} onChange={(e) => setDelivPct(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliv-notes">Notes</Label>
                      <Input id="deliv-notes" value={delivNotes} onChange={(e) => setDelivNotes(e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" size="sm" disabled={certifying}>
                    {certifying ? 'Certifying...' : 'Certify Deliverable'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {transactions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Budget Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Cost/msg</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><Badge variant="outline">{t.transactionType}</Badge></TableCell>
                      <TableCell className="text-sm">R{t.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{t.recipientCount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">R{t.costPerRecipient.toFixed(4)}</TableCell>
                      <TableCell><Badge variant={t.status === 'completed' ? 'default' : t.status === 'failed' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
