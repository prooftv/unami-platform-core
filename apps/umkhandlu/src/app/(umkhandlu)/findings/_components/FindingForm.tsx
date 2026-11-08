'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createFindingAction, updateFindingAction } from '../_actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const TYPES      = [{ value: 'gap', label: 'Gap' }, { value: 'exception', label: 'Exception' }, { value: 'incident', label: 'Incident' }];
const SEVERITIES = ['critical','high','medium','low'];
const STATUSES   = [
  { value: 'open',        label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'accepted',    label: 'Accepted' },
];

interface Finding {
  id: string; finding_type: string; title: string; description: string | null;
  severity: string; owner: string; status: string;
}
interface Props { finding?: Finding }

export function FindingForm({ finding }: Props) {
  const router = useRouter();
  const isEdit = !!finding;

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = isEdit
        ? await updateFindingAction(finding.id, formData)
        : await createFindingAction(formData);
      if (result.success) router.push('/findings');
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Finding Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="finding_type">Type *</Label>
              <Select name="finding_type" required defaultValue={finding?.finding_type ?? ''}>
                <SelectTrigger id="finding_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity *</Label>
              <Select name="severity" required defaultValue={finding?.severity ?? ''}>
                <SelectTrigger id="severity"><SelectValue placeholder="Select severity" /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required defaultValue={finding?.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={finding?.description ?? ''} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="owner">Owner *</Label>
              <Input id="owner" name="owner" required defaultValue={finding?.owner} />
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={finding.status}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add finding'}</Button>
      </div>
    </form>
  );
}
