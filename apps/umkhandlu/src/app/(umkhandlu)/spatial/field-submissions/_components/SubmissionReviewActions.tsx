'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reviewFieldSubmission } from '../_actions';

export function SubmissionReviewActions({
  submissionId,
  currentStatus,
}: {
  submissionId: string;
  currentStatus: string;
}) {
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  function act(action: 'approve' | 'reject' | 'request_correction' | 'open_review') {
    startTransition(async () => {
      const r = await reviewFieldSubmission(submissionId, action, notes || undefined);
      setResult(r);
    });
  }

  if (result?.success) {
    return <p className="text-sm text-green-700">Action recorded. Refreshing…</p>;
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Review notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="text-sm"
      />
      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'pending' && (
          <Button size="sm" variant="outline" onClick={() => act('open_review')} disabled={isPending}>
            Open for Review
          </Button>
        )}
        <Button size="sm" onClick={() => act('approve')} disabled={isPending}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => act('request_correction')} disabled={isPending}>
          Request Correction
        </Button>
        <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={isPending}>
          Reject
        </Button>
      </div>
    </div>
  );
}
