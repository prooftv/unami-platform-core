'use client';

import { useState, useTransition } from 'react';
import { recordDiscrepancyReviewAction, type DiscrepancyReviewOutcome } from '../_actions';

const OUTCOMES: { value: DiscrepancyReviewOutcome; label: string }[] = [
  { value: 'confirmed-discrepancy', label: 'Confirmed discrepancy — both sources differ materially' },
  { value: 'accepted-variation', label: 'Accepted variation — distance is explainable' },
  { value: 'resolved-verified', label: 'Resolved — one source verified and accepted' },
  { value: 'dismissed', label: 'Dismissed — record reason below' },
];

export function DiscrepancyReviewForm({ discrepancyId }: { discrepancyId: string }) {
  const [outcome, setOutcome] = useState<DiscrepancyReviewOutcome>('accepted-variation');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await recordDiscrepancyReviewAction(discrepancyId, outcome, notes);
      setResult(res);
    });
  }

  if (result?.success) {
    return <p className="text-xs text-green-700 bg-green-50 rounded px-3 py-2">Review recorded.</p>;
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-xs font-medium text-muted-foreground">Record review outcome</p>
      <select
        className="w-full text-xs border rounded px-2 py-1.5 bg-background"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value as DiscrepancyReviewOutcome)}
      >
        {OUTCOMES.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <textarea
        className="w-full text-xs border rounded px-2 py-1.5 bg-background resize-none"
        rows={2}
        placeholder="Notes (required)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {result?.error && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
      <button
        onClick={submit}
        disabled={pending || !notes.trim()}
        className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save review'}
      </button>
    </div>
  );
}
