import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CHILD_GENDER_LABELS,
  PROVINCE_LABELS,
  type ChildRecord,
  type School,
  type UserRecord,
} from '@/domain/uncip/types';
import { ChildStatusBadge } from './ChildStatusBadge';
import { GuardianList } from './GuardianList';

interface Props {
  child: ChildRecord;
  school: School | null;
  hasActiveAlert: boolean;
  /** Resolved user records for guardian lookup. Keyed by userId. */
  users: Record<string, UserRecord>;
}

export function ChildDetailPanel({ child, school, hasActiveAlert, users }: Props) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase();

  return (
    <div className="space-y-4">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              {child.photoUrl && <AvatarImage src={child.photoUrl} alt={child.firstName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">
                {child.firstName} {child.lastName}
              </p>
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

      {/* Address */}
      {child.address && (
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>{child.address.street}</p>
            <p>
              {child.address.city}, {PROVINCE_LABELS[child.address.province]}
              {child.address.postalCode && ` ${child.address.postalCode}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Medical */}
      {child.medicalInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {child.medicalInfo.bloodType && (
              <p>Blood type: <span className="font-medium">{child.medicalInfo.bloodType}</span></p>
            )}
            {child.medicalInfo.allergies.length > 0 && (
              <p>Allergies: {child.medicalInfo.allergies.join(', ')}</p>
            )}
            {child.medicalInfo.conditions.length > 0 && (
              <p>Conditions: {child.medicalInfo.conditions.join(', ')}</p>
            )}
            {child.medicalInfo.medications.length > 0 && (
              <p>Medications: {child.medicalInfo.medications.join(', ')}</p>
            )}
            {child.medicalInfo.emergencyContactName && (
              <p>
                Emergency contact: {child.medicalInfo.emergencyContactName}
                {child.medicalInfo.emergencyContactRelationship &&
                  ` (${child.medicalInfo.emergencyContactRelationship})`}
                {child.medicalInfo.emergencyContactPhone &&
                  ` · ${child.medicalInfo.emergencyContactPhone}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guardians */}
      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
        </CardHeader>
        <CardContent>
          <GuardianList guardians={child.guardians} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
