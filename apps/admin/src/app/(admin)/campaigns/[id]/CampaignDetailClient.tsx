'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@unami/ui';
import { Pencil } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { CampaignWithSponsor, AdminSession, BudgetTransaction } from '@unami/api';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending_review: 'secondary', approved: 'outline', active: 'default',
  paused: 'secondary', completed: 'outline', cancelled: 'destructive', published: 'default',
};

interface Props {
  campaign: CampaignWithSponsor;
  transactions: BudgetTransaction[];
  session: AdminSession;
}

export function CampaignDetailClient({ campaign, transactions, session }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isSuperadmin = session.role === 'superadmin';
  const canEdit = (isSuperadmin || session.role === 'content_admin') && campaign.status !== 'completed' && campaign.status !== 'cancelled';
  const canApprove = isSuperadmin && (campaign.status === 'pending_review' || campaign.status === 'paused');
  const canPause = (isSuperadmin || session.role === 'content_admin') && campaign.status === 'active';
  const canCancel = isSuperadmin && campaign.status !== 'completed' && campaign.status !== 'cancelled';

  const totalSpent = transactions.filter((t) => t.transactionType === 'spend' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const utilPct = campaign.budget > 0 ? Math.round((totalSpent / campaign.budget) * 100) : 0;

  async function doAction(action: 'approve' | 'pause' | 'cancel') {
    if (action === 'cancel' && !confirm('Cancel this campaign?')) return;
    setActing(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      if (action === 'approve') await api.campaigns.approve(campaign.id);
      else if (action === 'pause') await api.campaigns.pause(campaign.id);
      else await api.campaigns.cancel(campaign.id);
      setFeedback(`Campaign ${action}d`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
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
            {canCancel && <Button size="sm" variant="destructive" onClick={() => doAction('cancel')} disabled={acting}>Cancel</Button>}
          </div>
        }
      />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

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
