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
import { getToken } from '@/lib/auth/token';
import {
  NoticeType,
  NOTICE_TYPE_LABELS,
  STATUTORY_NOTICE_TYPES,
} from '@/domain/umkhandlu';

const COMMUNITY_TYPES = Object.values(NoticeType).filter(
  (t) => !STATUTORY_NOTICE_TYPES.includes(t as typeof STATUTORY_NOTICE_TYPES[number])
);
const STATUTORY_TYPES = STATUTORY_NOTICE_TYPES as unknown as string[];

export function CreateNoticeClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentDeadline, setCommentDeadline] = useState('');

  const isStatutory = STATUTORY_TYPES.includes(type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!type) { setError('Notice type is required'); return; }
    if (title.trim().length < 3) { setError('Title must be at least 3 characters'); return; }
    if (content.trim().length < 10) { setError('Content must be at least 10 characters'); return; }
    if (isStatutory && !commentDeadline) { setError('Comment deadline is required for statutory notices'); return; }

    startTransition(async () => {
      try {
        const token = await getToken();
        const api = createApiClient({
          baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
          token,
        });
        const notice = await api.notices.create({
          type: type as import('@unami/api').GovernanceNoticeType,
          title: title.trim(),
          content: content.trim(),
          commentDeadline: isStatutory && commentDeadline
            ? new Date(commentDeadline).toISOString()
            : null,
        });
        router.push(`/notices/${notice.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create notice');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <PageHeader
          title="New Notice"
          description="Create a community or statutory notice"
          actions={
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/notices')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Notice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type">Notice Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>Select type...</SelectItem>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Community</div>
                      {COMMUNITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{NOTICE_TYPE_LABELS[t as keyof typeof NOTICE_TYPE_LABELS]}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Statutory</div>
                      {STATUTORY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{NOTICE_TYPE_LABELS[t as keyof typeof NOTICE_TYPE_LABELS]}</SelectItem>
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
                    placeholder="e.g. Community Meeting — April 2025"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Full notice body..."
                    rows={8}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">{content.length}/5000</p>
                </div>
              </CardContent>
            </Card>

            {isStatutory && (
              <Card>
                <CardHeader><CardTitle>Statutory Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="commentDeadline">Comment Deadline</Label>
                    <Input
                      id="commentDeadline"
                      type="date"
                      value={commentDeadline}
                      onChange={(e) => setCommentDeadline(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Last date for public comments. Required before the notice can be opened.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/notices')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Notice'}
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Notice Categories</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Community notices announce meetings, resolutions, and updates. They produce governance records.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Statutory notices invite public comment on proposed actions governed by legislation. They require a comment deadline.
                  </p>
                </CardContent>
              </Card>
              {isStatutory && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Statutory Rules</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      A statutory notice cannot be opened for public participation without a comment deadline set.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
