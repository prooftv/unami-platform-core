'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { PlatformRecord } from '@unami/api';
import {
  CommunityRecordType,
  COMMUNITY_RECORD_TYPE_LABELS,
  COMMUNITY_RECORD_STATUS_VARIANT,
  COMMUNITY_RECORD_TRANSITIONS,
} from '@/domain/moments/enums';
import { createRecordAction, transitionRecordStatusAction } from '../_actions/moment-actions';

interface Props {
  momentId: string;
  initialRecords: PlatformRecord[];
  canManage: boolean;
}

export function RecordsPanel({ momentId, initialRecords, canManage }: Props) {
  const [records, setRecords] = useState<PlatformRecord[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // form state
  const [type, setType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [parentRecordId, setParentRecordId] = useState<string>('');

  function resetForm() {
    setType(''); setTitle(''); setContent(''); setApprovedBy(''); setParentRecordId('');
    setShowForm(false); setError(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !title.trim() || !content.trim()) {
      setError('Type, title, and content are required.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createRecordAction(momentId, {
        type,
        title: title.trim(),
        content: content.trim(),
        approvedBy: approvedBy.trim() || null,
        parentRecordId: parentRecordId || null,
      });
      if (res.error) { setError(res.error); return; }
      setFeedback('Record created.');
      resetForm();
      // optimistic: reload is handled by revalidatePath — router.refresh not needed here
      // parent page.tsx will re-fetch on next navigation; for immediate feedback we append a placeholder
    });
  }

  function handleTransition(recordId: string, status: string) {
    setError(null);
    startTransition(async () => {
      const res = await transitionRecordStatusAction(momentId, recordId, status);
      if (res.error) { setError(res.error); return; }
      setRecords((prev) =>
        prev.map((r) => r.id === recordId ? { ...r, status: status as PlatformRecord['status'] } : r)
      );
    });
  }

  const eligibleParents = records.filter((r) => r.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4" />
          Community Records
          {records.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{records.length}</Badge>
          )}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => { setShowForm((v) => !v); setError(null); setFeedback(null); }}
            >
              {showForm ? <ChevronUp className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {showForm ? 'Cancel' : 'Add Record'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Record list */}
        {records.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">
            No community records attached to this moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {records.map((record) => {
              const typeLabel = COMMUNITY_RECORD_TYPE_LABELS[record.type as keyof typeof COMMUNITY_RECORD_TYPE_LABELS] ?? record.type;
              const statusVariant = COMMUNITY_RECORD_STATUS_VARIANT[record.status as keyof typeof COMMUNITY_RECORD_STATUS_VARIANT] ?? 'outline';
              const transitions = record.status === 'pending'
                ? (COMMUNITY_RECORD_TRANSITIONS[record.type as keyof typeof COMMUNITY_RECORD_TRANSITIONS] ?? [])
                : [];

              return (
                <li key={record.id} className="rounded-md border px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs text-muted-foreground">{typeLabel}</p>
                      <p className="text-sm font-medium truncate">{record.title}</p>
                    </div>
                    <Badge variant={statusVariant} className="shrink-0">{record.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{record.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(record.createdAt).toLocaleDateString('en-ZA')}</span>
                    {record.approvedBy && <span>Recorded by: {record.approvedBy}</span>}
                  </div>
                  {canManage && transitions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {transitions.map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleTransition(record.id, s)}
                        >
                          Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Create form */}
        {canManage && showForm && (
          <form onSubmit={handleCreate} className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="record-type">Type <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="record-type">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CommunityRecordType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {COMMUNITY_RECORD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="record-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="record-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief descriptive title"
                minLength={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="record-content">Content <span className="text-destructive">*</span></Label>
              <Textarea
                id="record-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full record content"
                rows={4}
                minLength={10}
                maxLength={5000}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="record-approved-by">Recorded by</Label>
              <Input
                id="record-approved-by"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="Name or role of the person who recorded this"
                maxLength={200}
              />
            </div>

            {eligibleParents.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="record-parent">Follows from (optional)</Label>
                <Select value={parentRecordId} onValueChange={setParentRecordId}>
                  <SelectTrigger id="record-parent">
                    <SelectValue placeholder="Select parent record" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {eligibleParents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {COMMUNITY_RECORD_TYPE_LABELS[r.type as keyof typeof COMMUNITY_RECORD_TYPE_LABELS] ?? r.type} — {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
