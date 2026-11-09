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
import type { SpatialSource, PermissionClassification } from '@/lib/gis/spatial-sources-fetcher';

const SOURCE_TYPES = [
  { value: 'arcgis-featureserver', label: 'ArcGIS FeatureServer' },
  { value: 'arcgis-mapserver',     label: 'ArcGIS MapServer' },
  { value: 'wfs',                  label: 'WFS' },
  { value: 'download',             label: 'Download' },
  { value: 'static-map',           label: 'Static Map' },
];

const PERMISSION_CLASSIFICATIONS: { value: PermissionClassification; label: string; description: string }[] = [
  { value: 'pending',      label: 'Pending',      description: 'Not yet assessed. Blocks all ingestion.' },
  { value: 'reference',    label: 'Reference',    description: 'Consult only. No copying, processing or redistribution.' },
  { value: 'display',      label: 'Display',      description: 'Display permitted under stated conditions. No download or redistribution.' },
  { value: 'internal',     label: 'Internal use', description: 'Ingest and process within authorised Unami operations only.' },
  { value: 'download',     label: 'Download',     description: 'Download and process permitted. Redistribution requires separate assessment.' },
  { value: 'redistribute', label: 'Redistribute', description: 'Redistribution expressly permitted under stated terms.' },
  { value: 'restricted',   label: 'Restricted',   description: 'Subject to explicit restrictions. Requires authorised clearance. Blocks all ingestion.' },
  { value: 'prohibited',   label: 'Prohibited',   description: 'Use not permitted. Must not be ingested, displayed or referenced.' },
];

const AVAILABILITY_STATUSES = [
  { value: 'unknown',       label: 'Unknown' },
  { value: 'accessible',    label: 'Accessible' },
  { value: 'inaccessible',  label: 'Inaccessible' },
  { value: 'requires_auth', label: 'Requires authentication' },
];

const TECHNICAL_USABILITY_STATUSES = [
  { value: 'unknown',             label: 'Unknown' },
  { value: 'ingestible',          label: 'Ingestible' },
  { value: 'blocked',             label: 'Blocked (query endpoint restricted)' },
  { value: 'requires_processing', label: 'Requires processing' },
  { value: 'static',              label: 'Static (not queryable)' },
];

const AUTHORITY_STATUSES = [
  { value: 'unknown',       label: 'Unknown' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'indicative',    label: 'Indicative' },
  { value: 'unverified',    label: 'Unverified' },
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

  const currentClassification = source?.permission_classification ?? 'pending';
  const classificationDescription = PERMISSION_CLASSIFICATIONS.find(
    (p) => p.value === currentClassification,
  )?.description;

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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="dataset_identifier">Dataset identifier</Label>
                <Input id="dataset_identifier" name="dataset_identifier" defaultValue={source?.dataset_identifier ?? ''} placeholder="Source-assigned ID" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source_url">Source URL</Label>
              <Input id="source_url" name="source_url" type="url" defaultValue={source?.source_url ?? ''} placeholder="Human-readable source or catalogue page" />
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
              <Label htmlFor="permission_classification">Permission classification *</Label>
              <Select name="permission_classification" defaultValue={currentClassification}>
                <SelectTrigger id="permission_classification"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERMISSION_CLASSIFICATIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classificationDescription && (
                <p className="text-xs text-muted-foreground">{classificationDescription}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attribution">Attribution requirements</Label>
              <Input id="attribution" name="attribution" defaultValue={source?.attribution ?? ''} placeholder="Required attribution text" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licence_terms">Licence or terms reference</Label>
              <Input id="licence_terms" name="licence_terms" defaultValue={source?.licence_terms ?? ''} placeholder="Licence name or URL" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="restriction_authority">Restriction authority</Label>
              <Input id="restriction_authority" name="restriction_authority" defaultValue={source?.restriction_authority ?? ''} placeholder="Who imposed the restriction" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="restriction_basis">Restriction basis</Label>
              <Textarea id="restriction_basis" name="restriction_basis" rows={2} defaultValue={source?.restriction_basis ?? ''} placeholder="Basis or scope of restriction" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Four-Dimension Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              These dimensions are independent. A positive answer on one does not imply a positive answer on any other.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="availability_status">Availability</Label>
                <Select name="availability_status" defaultValue={source?.availability_status ?? 'unknown'}>
                  <SelectTrigger id="availability_status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="technical_usability">Technical usability</Label>
                <Select name="technical_usability" defaultValue={source?.technical_usability ?? 'unknown'}>
                  <SelectTrigger id="technical_usability"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TECHNICAL_USABILITY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="authority_status">Authority</Label>
                <Select name="authority_status" defaultValue={source?.authority_status ?? 'unknown'}>
                  <SelectTrigger id="authority_status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUTHORITY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assessment_notes">Assessment notes</Label>
              <Textarea id="assessment_notes" name="assessment_notes" rows={3} defaultValue={source?.assessment_notes ?? ''} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea id="notes" name="notes" rows={3} defaultValue={source?.notes ?? ''} />
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
              <p className="font-medium text-foreground text-sm">Data governance rules</p>
              <p>Public accessibility is not permission to redistribute.</p>
              <p>Availability, permission, technical usability and authority are independent dimensions.</p>
              <p>Assign permission classification from confirmed source terms or custodian instructions only.</p>
              <p className="text-destructive font-medium">Water and sanitation data from Amajuba District is restricted — absolute, no exceptions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
