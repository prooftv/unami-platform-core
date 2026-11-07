'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createSourceAction, updateSourceAction } from '../../_actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { SpatialSource } from '@/lib/gis/spatial-sources-fetcher';

const SOURCE_TYPES = [
  { value: 'arcgis-featureserver', label: 'ArcGIS FeatureServer' },
  { value: 'arcgis-mapserver',     label: 'ArcGIS MapServer' },
  { value: 'wfs',                  label: 'WFS' },
  { value: 'download',             label: 'Download' },
  { value: 'static-map',           label: 'Static Map' },
];

const PERMISSION_STATUSES = [
  { value: 'pending',    label: 'Pending' },
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'denied',     label: 'Denied' },
  { value: 'reference',  label: 'Reference only' },
];

interface Props { source?: SpatialSource }

export function SourceForm({ source }: Props) {
  const router = useRouter();
  const isEdit = !!source;

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = isEdit
        ? await updateSourceAction(source.id, formData)
        : await createSourceAction(formData);
      if (result.success) router.push('/spatial/sources');
      return result;
    },
    null,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Source Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Source name *</Label>
              <Input id="name" name="name" required defaultValue={source?.name} placeholder="e.g. KZN COGTA Ward Boundaries 2024" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="institution">Institution *</Label>
              <Input id="institution" name="institution" required defaultValue={source?.institution} placeholder="e.g. KwaZulu-Natal COGTA" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source_type">Source type *</Label>
              <Select name="source_type" required defaultValue={source?.source_type ?? ''}>
                <SelectTrigger id="source_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={source?.description ?? ''} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="base_url">Base URL</Label>
              <Input id="base_url" name="base_url" type="url" defaultValue={source?.base_url ?? ''} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="layer_id">Layer ID</Label>
              <Input id="layer_id" name="layer_id" defaultValue={source?.layer_id ?? ''} placeholder="e.g. 0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="geographic_coverage">Coverage</Label>
                <Input id="geographic_coverage" name="geographic_coverage" defaultValue={source?.geographic_coverage ?? 'amajuba'} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coordinate_system">CRS</Label>
                <Input id="coordinate_system" name="coordinate_system" defaultValue={source?.coordinate_system ?? 'EPSG:4326'} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permission and Custodian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="permission_status">Permission status</Label>
              <Select name="permission_status" defaultValue={source?.permission_status ?? 'pending'}>
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
              <Textarea id="permission_notes" name="permission_notes" rows={2} defaultValue={source?.permission_notes ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="custodian_name">Custodian name</Label>
                <Input id="custodian_name" name="custodian_name" defaultValue={source?.custodian_name ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custodian_email">Custodian email</Label>
                <Input id="custodian_email" name="custodian_email" type="email" defaultValue={source?.custodian_email ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataset_date">Dataset date</Label>
              <Input id="dataset_date" name="dataset_date" defaultValue={source?.dataset_date ?? ''} placeholder="e.g. 2024-Q3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={source?.notes ?? ''} />
            </div>
          </CardContent>
        </Card>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add source'}</Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Data integrity rules</p>
              <p>A publicly accessible service is not permission to redistribute its data.</p>
              <p>Every source must record institution, custodian, date, CRS and permission status.</p>
              <p className="text-destructive font-medium">Water and sanitation data from Amajuba District is restricted — absolute, no exceptions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
