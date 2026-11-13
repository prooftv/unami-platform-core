'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createDatasetAction } from '../../_actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const PERMISSION_STATUSES = [
  { value: 'pending',    label: 'Pending' },
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'denied',     label: 'Denied' },
  { value: 'reference',  label: 'Reference only' },
];

interface Source { id: string; name: string; institution: string }
interface Props { sources: Source[] }

export function DatasetForm({ sources }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createDatasetAction(formData);
      if (result.success) router.push('/spatial/datasets');
      return result;
    },
    null,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dataset Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="source_id">Source *</Label>
              <Select name="source_id" required>
                <SelectTrigger id="source_id"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.institution} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Dataset name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Ward Boundaries 2024" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="layer_id">Layer ID</Label>
              <Input id="layer_id" name="layer_id" placeholder="e.g. 0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source_url">Dataset source URL</Label>
              <Input
                id="source_url"
                name="source_url"
                type="url"
                placeholder="https://data.example.org/dataset"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Technical Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crs">CRS</Label>
                <Input id="crs" name="crs" defaultValue="EPSG:4326" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataset_date">Dataset date</Label>
                <Input id="dataset_date" name="dataset_date" placeholder="e.g. 2024-Q3" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provenance">Provenance</Label>
              <Textarea id="provenance" name="provenance" rows={2} placeholder="How was this dataset obtained?" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permission and Custodian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="permission_status">Permission status</Label>
              <Select name="permission_status" defaultValue="pending">
                <SelectTrigger id="permission_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERMISSION_STATUSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="permission_notes">Permission notes</Label>
              <Textarea id="permission_notes" name="permission_notes" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="custodian_name">Custodian name</Label>
                <Input id="custodian_name" name="custodian_name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custodian_email">Custodian email</Label>
                <Input id="custodian_email" name="custodian_email" type="email" />
              </div>
            </div>
          </CardContent>
        </Card>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Register dataset'}</Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20">
          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Provenance required</p>
              <p>Every dataset must record institution, custodian, date obtained, CRS and permission status.</p>
              <p>Automated imports are staged — operator approval required before publication.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
