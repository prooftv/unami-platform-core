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

// ─── Province ────────────────────────────────────────────────────────────────
// Nine South African provinces.

export type Province =
  | 'eastern_cape'
  | 'free_state'
  | 'gauteng'
  | 'kwazulu_natal'
  | 'limpopo'
  | 'mpumalanga'
  | 'north_west'
  | 'northern_cape'
  | 'western_cape';

export const PROVINCE_LABELS: Record<Province, string> = {
  eastern_cape: 'Eastern Cape',
  free_state: 'Free State',
  gauteng: 'Gauteng',
  kwazulu_natal: 'KwaZulu-Natal',
  limpopo: 'Limpopo',
  mpumalanga: 'Mpumalanga',
  north_west: 'North West',
  northern_cape: 'Northern Cape',
  western_cape: 'Western Cape',
};

// ─── School ───────────────────────────────────────────────────────────────────

export interface School {
  id: string;
  name: string;
  /** EMIS number — DBE school identifier. Optional until safeguarding review. */
  emis: string | null;
  province: Province;
  address: string;
  contactPhone: string | null;
  contactEmail: string | null;
}

// ─── SAPS Station ─────────────────────────────────────────────────────────────
// Geographic scoping unit for authority and community users.
// UNRESOLVED: whether parent users are also station-scoped (deferred to auth/domain policy phase).

export interface SAPSStation {
  id: string;
  name: string;
  province: Province;
  district: string | null;
  contactPhone: string | null;
}

// ─── User record ──────────────────────────────────────────────────────────────
// Represents a registered user in the UNCIP system.
// UNRESOLVED: whether parent role carries a stationId (deferred to auth/domain policy phase).

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: UNCIPRole;
  /**
   * Station area scope. Set for authority and community roles.
   * Parent scope is unresolved — do not assume this is set for parents.
   */
  stationId: string | null;
  /** School assignment. Set for school role only. */
  schoolId: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Child sub-types ──────────────────────────────────────────────────────────

export interface ChildAddress {
  street: string;
  city: string;
  province: Province;
  postalCode: string | null;
}

export interface ChildMedicalInfo {
  bloodType: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
}

// ─── Guardian link ────────────────────────────────────────────────────────────
// Join record between a user (guardian) and a child.
// Replaces the V1 dual model (parentId + guardians[]).

export interface GuardianLink {
  id: string;
  childId: string;
  userId: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
}

// ─── Alert timeline ───────────────────────────────────────────────────────────
// UNRESOLVED: which roles are permitted to perform each action (deferred to auth phase).

export type AlertTimelineAction =
  | 'alert_raised'
  | 'school_confirmed_last_seen'
  | 'authority_assigned_case'
  | 'community_sighting_reported'
  | 'status_changed'
  | 'note_added';

export const ALERT_TIMELINE_ACTION_LABELS: Record<AlertTimelineAction, string> = {
  alert_raised: 'Alert Raised',
  school_confirmed_last_seen: 'School Confirmed Last Seen',
  authority_assigned_case: 'Case Number Assigned',
  community_sighting_reported: 'Sighting Reported',
  status_changed: 'Status Changed',
  note_added: 'Note Added',
};

export interface AlertTimelineEntry {
  id: string;
  alertId: string;
  actorId: string;
  actorRole: UNCIPRole;
  action: AlertTimelineAction;
  note: string | null;
  timestamp: string;
}

// ─── Alert record ─────────────────────────────────────────────────────────────
// Single flat schema. V1 dual schema (nested lastSeen + flat fields) is retired.
// Single alertType field. V1 dual field (alertType + type) is retired.

export interface AlertRecord {
  id: string;
  childId: string;
  alertType: AlertType;
  status: AlertStatus;
  description: string;
  lastSeenAt: string;
  lastSeenLocation: string;
  lastSeenWearing: string | null;
  contactPhone: string;
  timeline: AlertTimelineEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

// ─── Child record ─────────────────────────────────────────────────────────────
// Central entity. Everything else attaches to or operates around this.
// UNRESOLVED: whether identificationNumber is required or optional (deferred to safeguarding review).

export interface ChildRecord {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: ChildGender;
  photoUrl: string | null;
  /** SA ID number or birth certificate number. Required/optional status unresolved. */
  identificationNumber: string | null;
  schoolId: string | null;
  address: ChildAddress | null;
  medicalInfo: ChildMedicalInfo | null;
  /** Guardian join records. Replaces V1 parentId + guardians[] dual model. */
  guardians: GuardianLink[];
  createdAt: string;
  updatedAt: string;
}
