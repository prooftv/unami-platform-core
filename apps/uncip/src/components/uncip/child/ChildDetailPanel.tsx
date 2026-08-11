import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CHILD_GENDER_LABELS, PROVINCE_LABELS } from '@/domain/uncip/types';
import type { UNCIPChild, UNCIPSchool } from '@unami/api';
import type { UserRecord } from '@/domain/uncip/types';
import { ChildStatusBadge } from './ChildStatusBadge';
import { GuardianList } from './GuardianList';

interface Props {
  child: UNCIPChild;
  school: UNCIPSchool | null;
  hasActiveAlert: boolean;
  users: Record<string, UserRecord>;
}

export function ChildDetailPanel({ child, school, hasActiveAlert, users }: Props) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase();
  const medical  = child.uncipChildMedical ?? null;
  const guardians = child.uncipGuardianLinks ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              {child.photoUrl && <AvatarImage src={child.photoUrl} alt={child.firstName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{child.firstName} {child.lastName}</p>
              <p className="text-sm text-muted-foreground">
                {CHILD_GENDER_LABELS[child.gender]} · DOB {child.dateOfBirth}
              </p>
              {school && <p className="text-sm text-muted-foreground">{school.name}</p>}
            </div>
            <div className="ml-auto">
              <ChildStatusBadge hasActiveAlert={hasActiveAlert} />
            </div>
          </div>
        </CardContent>
      </Card>

      {child.addressStreet && (
        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{child.addressStreet}</p>
            <p>
              {child.addressCity}
              {child.addressProvince && `, ${PROVINCE_LABELS[child.addressProvince]}`}
              {child.addressPostalCode && ` ${child.addressPostalCode}`}
            </p>
          </CardContent>
        </Card>
      )}

      {medical && (
        <Card>
          <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {medical.bloodType && (
              <p>Blood type: <span className="font-medium">{medical.bloodType}</span></p>
            )}
            {medical.allergies.length > 0 && <p>Allergies: {medical.allergies.join(', ')}</p>}
            {medical.conditions.length > 0 && <p>Conditions: {medical.conditions.join(', ')}</p>}
            {medical.medications.length > 0 && <p>Medications: {medical.medications.join(', ')}</p>}
            {medical.emergencyContactName && (
              <p>
                Emergency contact: {medical.emergencyContactName}
                {medical.emergencyContactRelationship && ` (${medical.emergencyContactRelationship})`}
                {medical.emergencyContactPhone && ` · ${medical.emergencyContactPhone}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Guardians</CardTitle></CardHeader>
        <CardContent>
          <GuardianList guardians={guardians} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
