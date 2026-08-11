// UNCIP domain types.
// These are the typed contracts for the UNCIP application domain.
// Backend implementation is deferred — these types define the shape, not the source.

// ─── Roles ───────────────────────────────────────────────────────────────────

export type UNCIPRole = 'admin' | 'parent' | 'school' | 'authority' | 'community';

export const UNCIP_ROLE_LABELS: Record<UNCIPRole, string> = {
  admin: 'Administrator',
  parent: 'Parent / Guardian',
  school: 'School Staff',
  authority: 'Authority',
  community: 'Community Member',
};

// ─── Session contract ─────────────────────────────────────────────────────────
// The typed session shape the application depends on.
// Supplied by MockUNCIPSessionProvider during the foundation phase.
// Will be supplied by Supabase Auth + Edge Function in the auth phase.

export interface UNCIPSession {
  id: string;
  email: string;
  name: string | null;
  role: UNCIPRole;
  /** SAPS station area this user is scoped to. Null for admin. */
  stationId: string | null;
  /** School this user is assigned to. Only set for school role. */
  schoolId: string | null;
}

// ─── Alert domain ─────────────────────────────────────────────────────────────

export type AlertType = 'missing' | 'medical' | 'danger' | 'other';
export type AlertStatus = 'active' | 'resolved' | 'cancelled' | 'false_alarm';

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  missing: 'Missing Child',
  medical: 'Medical Emergency',
  danger: 'Child in Danger',
  other: 'Other',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  active: 'Active',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
  false_alarm: 'False Alarm',
};

// ─── Child domain ─────────────────────────────────────────────────────────────

export type ChildGender = 'male' | 'female' | 'other';

export const CHILD_GENDER_LABELS: Record<ChildGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

// ─── Guardian relationship ────────────────────────────────────────────────────

export type GuardianRelationship = 'parent' | 'grandparent' | 'foster_carer' | 'other';

export const GUARDIAN_RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  parent: 'Parent',
  grandparent: 'Grandparent',
  foster_carer: 'Foster Carer',
  other: 'Other',
};
