'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createApiClient } from '@unami/api';
import type { GovernanceNotice } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { RECORD_TYPE_LABELS, RecordType } from '@/domain/umkhandlu';

interface Props {
  notices: GovernanceNotice[];
}

export function CreateRecordClient({ notices }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originNoticeId, setOriginNoticeId] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!type) { setError('Record type is required'); return; }
    if (title.trim().length < 3) { setError('Title must be at least 3 characters'); return; }
    if (content.trim().length < 10) { setError('Content must be at least 10 characters'); return; }

    startTransition(async () => {
      try {
        const token = await getToken();
        const api = createApiClient({
          baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
          token,
        });
        const record = await api.records.create({
          type: type as import('@unami/api').GovernanceRecordType,
          title: title.trim(),
          content: content.trim(),
          originNoticeId: originNoticeId || null,
        });
        router.push(`/records/${record.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create record');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
          title="New Governance Record"
          description="Create an institutional memory record"
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/records')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Record Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Record Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RecordType).map((t) => (
                        <SelectItem key={t} value={t}>{RECORD_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Council Meeting Minutes — March 2025"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Full record body..."
                    rows={8}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">{content.length}/5000</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Lineage</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="originNotice">Origin Notice</Label>
                  <Select value={originNoticeId} onValueChange={setOriginNoticeId}>
                    <SelectTrigger id="originNotice">
                      <SelectValue placeholder="None — root record" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None — root record</SelectItem>
                      {notices.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The notice that produced this record. Leave empty for a root record.
                  </p>
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/records')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Record'}
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Immutability</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Records are write-once. Title and content cannot be changed after creation.
                    Status transitions and evidence attachments are the only permitted updates.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Lineage</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Link to an origin notice to place this record in the governance chain.
                    A record without a parent or origin notice is a root record — valid but notable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
