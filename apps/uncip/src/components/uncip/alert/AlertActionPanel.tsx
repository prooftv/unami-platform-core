'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UNCIPRole } from '@/domain/uncip/types';
import type { AlertStatus } from '@unami/api';

interface Props {
  alertId: string;
  currentStatus: AlertStatus;
  role: UNCIPRole;
  onAction: (formData: FormData) => Promise<void>;
}

// Decision 3b: parent → cancelled/false_alarm only; authority → resolved
const STATUS_OPTIONS: Record<UNCIPRole, { value: Exclude<AlertStatus, 'active'>; label: string }[]> = {
  parent:    [{ value: 'cancelled', label: 'Cancel Alert' }, { value: 'false_alarm', label: 'Mark False Alarm' }],
  authority: [{ value: 'resolved', label: 'Resolve' }, { value: 'cancelled', label: 'Cancel' }, { value: 'false_alarm', label: 'False Alarm' }],
  admin:     [{ value: 'resolved', label: 'Resolve' }, { value: 'cancelled', label: 'Cancel' }, { value: 'false_alarm', label: 'False Alarm' }],
  school:    [],
  community: [],
};

export function AlertActionPanel({ alertId, currentStatus, role, onAction }: Props) {
  const [pending, startTransition] = useTransition();
  const statusOptions = STATUS_OPTIONS[role] ?? [];

  if (currentStatus !== 'active') return null;
  if (statusOptions.length === 0 && role !== 'school' && role !== 'community' && role !== 'authority') return null;

  return (
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent className="space-y-4">

        {/* Note — all roles */}
        <form action={(fd) => startTransition(() => onAction(fd))}>
          <input type="hidden" name="action" value="note_added" />
          <input type="hidden" name="alertId" value={alertId} />
          <div className="space-y-2">
            <Label htmlFor="note">Add Note</Label>
            <Textarea id="note" name="note" rows={2} placeholder="Add a note to the timeline" />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>Add Note</Button>
          </div>
        </form>

        {/* School confirmation */}
        {role === 'school' && (
          <form action={(fd) => startTransition(() => onAction(fd))}>
            <input type="hidden" name="action" value="school_confirmed_last_seen" />
            <input type="hidden" name="alertId" value={alertId} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>Confirm Last Seen</Button>
          </form>
        )}

        {/* Authority case assignment */}
        {(role === 'authority' || role === 'admin') && (
          <form action={(fd) => startTransition(() => onAction(fd))}>
            <input type="hidden" name="action" value="authority_assigned_case" />
            <input type="hidden" name="alertId" value={alertId} />
            <div className="space-y-2">
              <Label htmlFor="caseNumber">SAPS Case Number</Label>
              <Textarea id="caseNumber" name="caseNumber" rows={1} placeholder="e.g. CAS 123/08/2026" />
              <Label htmlFor="caseNote">Note (optional)</Label>
              <Textarea id="caseNote" name="note" rows={1} placeholder="Additional context" />
              <Button type="submit" variant="outline" size="sm" disabled={pending}>Assign Case Number</Button>
            </div>
          </form>
        )}

        {/* Community sighting */}
        {role === 'community' && (
          <form action={(fd) => startTransition(() => onAction(fd))}>
            <input type="hidden" name="action" value="community_sighting_reported" />
            <input type="hidden" name="alertId" value={alertId} />
            <div className="space-y-2">
              <Label htmlFor="sightingLocation">Where did you see the child?</Label>
              <Textarea id="sightingLocation" name="sightingLocation" rows={1} placeholder="e.g. Corner of Vilakazi and Moema" />
              <Label htmlFor="sightingNote">Additional details (optional)</Label>
              <Textarea id="sightingNote" name="note" rows={2} placeholder="Time, description, circumstances" />
              <Button type="submit" variant="outline" size="sm" disabled={pending}>Report Sighting</Button>
            </div>
          </form>
        )}

        {/* Status transition */}
        {statusOptions.length > 0 && (
          <form action={(fd) => startTransition(() => onAction(fd))}>
            <input type="hidden" name="action" value="change_status" />
            <input type="hidden" name="alertId" value={alertId} />
            <div className="space-y-2">
              <Label htmlFor="newStatus">Change Status</Label>
              <Select name="newStatus" required>
                <SelectTrigger id="newStatus"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea name="statusNote" rows={1} placeholder="Reason (optional)" />
              <Button type="submit" variant="destructive" size="sm" disabled={pending}>Update Status</Button>
            </div>
          </form>
        )}

      </CardContent>
    </Card>
  );
}
