'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { createNoticeAction, updateNoticeAction } from '../_actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const NOTICE_TYPES = [
  { value: 'meeting',        label: 'Meeting',              statutory: false },
  { value: 'announcement',   label: 'Announcement',         statutory: false },
  { value: 'resolution',     label: 'Resolution',           statutory: false },
  { value: 'alert',          label: 'Alert',                statutory: false },
  { value: 'opportunity',    label: 'Opportunity',          statutory: false },
  { value: 'employment',     label: 'Employment',           statutory: false },
  { value: 'smme',           label: 'SMME',                 statutory: false },
  { value: 'project-update', label: 'Project Update',       statutory: false },
  { value: 'eia',            label: 'EIA',                  statutory: true  },
  { value: 'rezoning',       label: 'Rezoning',             statutory: true  },
  { value: 'land-use',       label: 'Land Use',             statutory: true  },
  { value: 'township',       label: 'Township Establishment', statutory: true },
  { value: 'building',       label: 'Building Plans',       statutory: true  },
  { value: 'mining',         label: 'Mining',               statutory: true  },
  { value: 'liquor',         label: 'Liquor Licence',       statutory: true  },
  { value: 'telecom',        label: 'Telecommunications',   statutory: true  },
  { value: 'estate',         label: 'Estate Notice',        statutory: false },
  { value: 'liquidation',    label: 'Liquidation',          statutory: false },
  { value: 'pto',            label: 'PTO',                  statutory: false },
];

const STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'open',      label: 'Open for comment' },
  { value: 'closed',    label: 'Closed' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'archived',  label: 'Archived' },
];

interface Notice {
  id: string; type: string; title: string; content: string; status: string;
  comment_deadline: string | null; ward_ref: string | null;
  latitude: number | null; longitude: number | null;
}
interface Props { notice?: Notice }

export function NoticeForm({ notice }: Props) {
  const router = useRouter();
  const isEdit = !!notice;

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = isEdit
        ? await updateNoticeAction(notice.id, formData)
        : await createNoticeAction(formData);
      if (result.success) router.push(isEdit ? `/notices/${notice.id}` : '/notices');
      return result;
    },
    null,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Notice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type *</Label>
                <Select name="type" defaultValue={notice?.type ?? 'announcement'}>
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Governance</div>
                    {NOTICE_TYPES.filter((t) => !t.statutory).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1">Statutory</div>
                    {NOTICE_TYPES.filter((t) => t.statutory).map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label} ★</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={notice?.status ?? 'draft'}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required defaultValue={notice?.title} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" name="content" required rows={6} defaultValue={notice?.content} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment_deadline">Comment deadline</Label>
              <Input id="comment_deadline" name="comment_deadline" type="date"
                defaultValue={notice?.comment_deadline ?? ''} />
              <p className="text-xs text-muted-foreground">Required for statutory notices when status is Open.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Geographic Context</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ward_ref">Ward reference</Label>
              <Input id="ward_ref" name="ward_ref" defaultValue={notice?.ward_ref ?? ''}
                placeholder="e.g. Ward 3, Emnambithi" />
              <p className="text-xs text-muted-foreground">
                Used to link this notice to a ward boundary once spatial data is loaded.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" name="latitude" type="number" step="any"
                  defaultValue={notice?.latitude ?? ''} placeholder="-28.05" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" name="longitude" type="number" step="any"
                  defaultValue={notice?.longitude ?? ''} placeholder="29.00" />
              </div>
            </div>
          </CardContent>
        </Card>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add notice'}
          </Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Statutory notices</p>
              <p>EIA, rezoning, land-use, township, building, mining, liquor and telecom notices are automatically flagged as statutory.</p>
              <p>Statutory notices appear as map overlays on the Geographic View once coordinates are set.</p>
              <p>A comment deadline is required before setting status to Open.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Geographic context</p>
              <p>Ward reference links this notice to a ward boundary polygon when COGTA boundary data is loaded.</p>
              <p>Coordinates can be set manually now — they will be used immediately on the map.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
