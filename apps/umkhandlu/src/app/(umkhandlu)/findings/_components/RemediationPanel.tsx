'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRemediationAction, completeRemediationAction } from '../_actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus } from 'lucide-react';

interface Action {
  id: string; title: string; owner: string; due_date: string | null;
  status: string; completed_at: string | null; description: string | null;
}
interface Props { findingId: string; actions: Action[] }

export function RemediationPanel({ findingId, actions }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(formData: FormData) {
    setPending('add');
    setError(null);
    const res = await createRemediationAction(findingId, formData);
    if (res.error) setError(res.error);
    else { setShowForm(false); router.refresh(); }
    setPending(null);
  }

  async function handleComplete(id: string) {
    setPending(id);
    const res = await completeRemediationAction(id, findingId);
    if (res.error) setError(res.error);
    else router.refresh();
    setPending(null);
  }

  return (
    <div className="space-y-4">
      {actions.length > 0 && (
        <div className="divide-y border rounded-md">
          {actions.map((a) => (
            <div key={a.id} className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">Owner: {a.owner}{a.due_date ? ` · Due: ${new Date(a.due_date).toLocaleDateString()}` : ''}</p>
                {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  a.status === 'completed' ? 'bg-green-100 text-green-800' :
                  a.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-700'
                }`}>{a.status}</span>
                {a.status !== 'completed' && a.status !== 'cancelled' && (
                  <Button size="sm" variant="ghost" onClick={() => handleComplete(a.id)} disabled={pending === a.id}>
                    <CheckCircle className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showForm ? (
        <form action={handleAdd} className="space-y-3 border rounded-md p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rem-title">Title *</Label>
              <Input id="rem-title" name="title" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rem-owner">Owner *</Label>
              <Input id="rem-owner" name="owner" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rem-due">Due date</Label>
            <Input id="rem-due" name="due_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rem-desc">Description</Label>
            <Textarea id="rem-desc" name="description" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending === 'add'}>{pending === 'add' ? 'Saving…' : 'Add action'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="size-4 mr-1" />Add remediation action
        </Button>
      )}
    </div>
  );
}
