'use client';

import { useState } from 'react';
import { getPublicApiClient } from '@/lib/api/client';
import type { ParticipationResponseType, ParticipationRelationship } from '@unami/api';

interface Props {
  momentId: string;
  momentTitle: string;
}

type State = 'idle' | 'submitting' | 'success' | 'error';

export function ParticipationForm({ momentId, momentTitle }: Props) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const popia = fd.get('popia');

    if (popia !== 'on') {
      setErrorMsg('You must consent to POPIA before submitting.');
      setState('error');
      return;
    }

    try {
      const api = getPublicApiClient();
      await api.participation.submit({
        momentId,
        name: fd.get('name') as string,
        contact: fd.get('contact') as string,
        responseType: fd.get('responseType') as ParticipationResponseType,
        relationship: fd.get('relationship') as ParticipationRelationship,
        comment: fd.get('comment') as string,
        popiaConsent: true,
      });
      setState('success');
    } catch {
      setErrorMsg('Submission failed. Please try again.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-md border bg-muted/50 px-4 py-4 text-sm">
        <p className="font-medium text-foreground">Response submitted</p>
        <p className="mt-0.5 text-muted-foreground">
          Your response to <span className="font-medium">{momentTitle}</span> has been received.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border bg-muted/30 p-4 space-y-4 text-sm">
      <p className="font-medium text-foreground">Submit your response</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full name</label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contact" className="text-xs font-medium text-muted-foreground">Email or phone</label>
          <input
            id="contact"
            name="contact"
            required
            minLength={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="responseType" className="text-xs font-medium text-muted-foreground">Response type</label>
          <select
            id="responseType"
            name="responseType"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select…</option>
            <option value="comment">Comment</option>
            <option value="support">Support</option>
            <option value="concern">Concern</option>
            <option value="question">Question</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="relationship" className="text-xs font-medium text-muted-foreground">Your relationship</label>
          <select
            id="relationship"
            name="relationship"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select…</option>
            <option value="resident">Resident</option>
            <option value="business">Business</option>
            <option value="community">Community member</option>
            <option value="organisation">Organisation</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="comment" className="text-xs font-medium text-muted-foreground">Your response</label>
        <textarea
          id="comment"
          name="comment"
          required
          minLength={10}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      <div className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground space-y-2">
        <p>
          Your details are collected solely for this public participation process. They will be forwarded
          to the relevant authority and are not stored on this platform or used for any other purpose.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" name="popia" className="mt-0.5 shrink-0" required />
          <span>I consent to my details being used for this participation process in accordance with POPIA.</span>
        </label>
      </div>

      {state === 'error' && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit response'}
      </button>
    </form>
  );
}
