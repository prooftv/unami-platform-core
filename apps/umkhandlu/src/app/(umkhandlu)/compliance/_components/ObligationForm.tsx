'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createObligationAction, updateObligationAction } from '../_actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const STATUSES = [
  { value: 'under-review',   label: 'Under review' },
  { value: 'compliant',      label: 'Compliant' },
  { value: 'non-compliant',  label: 'Non-compliant' },
  { value: 'not-applicable', label: 'Not applicable' },
];

interface Obligation {
  id: string; identifier: string; title: string; description: string | null;
  source: string; responsible_party: string; due_date: string | null;
  recurrence: string | null; status: string;
}
interface Props { obligation?: Obligation }

export function ObligationForm({ obligation }: Props) {
  const router = useRouter();
  const isEdit = !!obligation;

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = isEdit
        ? await updateObligationAction(obligation.id, formData)
        : await createObligationAction(formData);
      if (result.success) router.push('/compliance');
      return result;
    },
    null,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Obligation Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Identifier *</Label>
                <Input id="identifier" name="identifier" required defaultValue={obligation?.identifier} placeholder="e.g. C-001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={obligation?.status ?? 'under-review'}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required defaultValue={obligation?.title} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={obligation?.description ?? ''} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Source and Responsibility</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="source">Source (legislation / regulation / policy) *</Label>
              <Input id="source" name="source" required defaultValue={obligation?.source} placeholder="e.g. MFMA s.65, POPIA s.22" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="responsible_party">Responsible party *</Label>
              <Input id="responsible_party" name="responsible_party" required defaultValue={obligation?.responsible_party} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" name="due_date" type="date" defaultValue={obligation?.due_date ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recurrence">Recurrence</Label>
                <Input id="recurrence" name="recurrence" defaultValue={obligation?.recurrence ?? ''} placeholder="e.g. Annual, Quarterly" />
              </div>
            </div>
          </CardContent>
        </Card>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add obligation'}</Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20">
          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Compliance integrity</p>
              <p>No automated legally reserved institutional decisions.</p>
              <p>Every obligation must cite its source legislation, regulation or policy.</p>
              <p>Assessment history is preserved — no deletion of compliance records.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
