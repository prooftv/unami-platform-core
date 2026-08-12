'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationPicker } from '@/components/uncip/map/LocationPicker';
import type { UNCIPRole } from '@/domain/uncip/types';
import type { AlertStatus } from '@unami/api';

interface Props {
  alertId: string;
  currentStatus: AlertStatus;
  role: UNCIPRole;
  onAction: (formData: FormData) => Promise<void>;
}

// Decision 3b: parent → cancelled/false_alarm only; authority/admin → resolved
const STATUS_OPTIONS: Record<UNCIPRole, { value: Exclude<AlertStatus, 'active'>; label: string }[]> = {
  parent:    [{ value: 'cancelled', label: 'Cancel Alert' }, { value: 'false_alarm', label: 'Mark False Alarm' }],
  authority: [{ value: 'resolved', label: 'Resolve' }, { value: 'cancelled', label: 'Cancel' }, { value: 'false_alarm', label: 'False Alarm' }],
  admin:     [{ value: 'resolved', label: 'Resolve' }, { value: 'cancelled', label: 'Cancel' }, { value: 'false_alarm', label: 'False Alarm' }],
  school:    [],
  community: [],
};

// Roles that have any action available on an active alert
// Mirrors Edge Function TIMELINE_ACTION_PERMISSIONS — UI reflects, does not enforce
const HAS_ACTIONS: UNCIPRole[] = ['admin', 'parent', 'school', 'authority', 'community'];

export function AlertActionPanel({ alertId, currentStatus, role, onAction }: Props) {
  const [pending, startTransition] = useTransition();

  if (currentStatus !== 'active') return null;
  if (!HAS_ACTIONS.includes(role)) return null;

  const statusOptions = STATUS_OPTIONS[role] ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent className="space-y-6">

        {/* School: confirm last seen */}
        {role === 'school' && (
          <form action={(fd) => startTransition(() => onAction(fd))} className="space-y-2">
            <input type="hidden" name="action" value="school_confirmed_last_seen" />
            <input type="hidden" name="alertId" value={alertId} />
            <p className="text-sm font-medium">Confirm Last Seen</p>
            <p className="text-xs text-muted-foreground">
              Confirm the child was last seen at your school. The confirmation timestamp is recorded automatically.
            </p>
            <div className="space-y-1">
              <Label htmlFor="schoolNote">Note (optional)</Label>
              <Textarea id="schoolNote" name="note" rows={2}
                placeholder="e.g. Last seen at morning assembly, 07:45" />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              Confirm Last Seen at School
            </Button>
          </form>
        )}

        {/* Authority / Admin: assign SAPS case number */}
        {(role === 'authority' || role === 'admin') && (
          <form action={(fd) => startTransition(() => onAction(fd))} className="space-y-2">
            <input type="hidden" name="action" value="authority_assigned_case" />
            <input type="hidden" name="alertId" value={alertId} />
            <p className="text-sm font-medium">Assign SAPS Case Number</p>
            <div className="space-y-1">
              <Label htmlFor="caseNumber">Case Number <span className="text-destructive">*</span></Label>
              <Input id="caseNumber" name="caseNumber" required
                placeholder="e.g. CAS 123/08/2026" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="caseNote">Note (optional)</Label>
              <Textarea id="caseNote" name="note" rows={1}
                placeholder="Additional context" />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              Assign Case Number
            </Button>
          </form>
        )}

        {/* Community: report sighting */}
        {role === 'community' && (
          <form action={(fd) => startTransition(() => onAction(fd))} className="space-y-2">
            <input type="hidden" name="action" value="community_sighting_reported" />
            <input type="hidden" name="alertId" value={alertId} />
            <p className="text-sm font-medium">Report Sighting</p>
            <div className="space-y-1">
              <Label htmlFor="sightingLocation">Where did you see the child? <span className="text-destructive">*</span></Label>
              <Input id="sightingLocation" name="sightingLocation" required
                placeholder="e.g. Corner of Vilakazi and Moema" />
            </div>
            <div className="space-y-1">
              <Label>Pin on map (optional)</Label>
              <LocationPicker latName="sightingLat" lngName="sightingLng" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sightingNote">Additional details (optional)</Label>
              <Textarea id="sightingNote" name="note" rows={2}
                placeholder="Time, description, circumstances" />
            </div>
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              Report Sighting
            </Button>
          </form>
        )}

        {/* All roles: add note */}
        <form action={(fd) => startTransition(() => onAction(fd))} className="space-y-2">
          <input type="hidden" name="action" value="note_added" />
          <input type="hidden" name="alertId" value={alertId} />
          <div className="space-y-1">
            <Label htmlFor="note">Add Note</Label>
            <Textarea id="note" name="note" rows={2}
              placeholder="Add a note to the timeline" />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={pending}>Add Note</Button>
        </form>

        {/* Status transition — parent / authority / admin */}
        {statusOptions.length > 0 && (
          <form action={(fd) => startTransition(() => onAction(fd))} className="space-y-2">
            <input type="hidden" name="action" value="change_status" />
            <input type="hidden" name="alertId" value={alertId} />
            <p className="text-sm font-medium">Change Status</p>
            <Select name="newStatus" required>
              <SelectTrigger id="newStatus"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea name="statusNote" rows={1} placeholder="Reason (optional)" />
            <Button type="submit" variant="destructive" size="sm" disabled={pending}>
              Update Status
            </Button>
          </form>
        )}

      </CardContent>
    </Card>
  );
}
