# UNCIP_DATA_MODEL.md
## Step 3 — Data Model Extraction

**Important:** This document describes data categories and system behaviour. It does not reproduce actual personal data values.

---

## Entity: users

**Purpose:** Stores user account profiles for all roles.

**Fields (evidenced by `src/types/user.ts` and `src/app/api/admin-sdk/users/route.ts`):**
| Field | Type | Notes |
|---|---|---|
| `id` | string | Firebase UID |
| `email` | string | Unique |
| `displayName` | string | Full name |
| `photoURL` | string | Optional profile photo URL |
| `role` | string | Primary role: `parent`, `school`, `authority`, `community`, `admin` |
| `roles` | string[] | Array of roles (multi-role support) |
| `phoneNumber` | string | Optional |
| `address` | string | Optional |
| `organization` | object | Optional: `{ id, name, type, address, contactInfo }` |
| `isActive` | boolean | Account active status |
| `createdAt` | ISO string | Creation timestamp |
| `updatedAt` | ISO string | Last update timestamp |
| `password` | string | **SECURITY CONCERN — see privacy document** |

**Relationships:** One user can be guardian of many children (via `children.guardians[]` or `children.parentId`). School users link to children via `schoolId` or `schoolName`.

**Lifecycle:** Created at registration. Can be deactivated (`isActive: false`). Can be deleted by admin.

**Ownership:** Admin manages all users. Users can update their own profile.

**Audit:** User creation is logged to `audit_logs` collection (evidenced in `admin-sdk/users/route.ts`).

---

## Entity: children

**Purpose:** Stores child identity and profile information.

**Fields (evidenced by `src/types/child.ts` and `src/lib/firebase/childrenApi.ts`):**
| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `firstName` | string | Required |
| `lastName` | string | Required |
| `dateOfBirth` | string | ISO date string |
| `gender` | string | `male`, `female`, `other` |
| `parentId` | string | Optional — newer direct parent FK |
| `guardians` | string[] | Optional — legacy array of user IDs |
| `schoolName` | string | Optional — denormalised school name |
| `schoolId` | string | Optional — FK to schools collection |
| `photoURL` | string | Optional — URL to child photograph |
| `identificationNumber` | string | Optional — SA ID number or birth certificate number |
| `address` | object | Optional: `{ street, city, province, postalCode }` |
| `medicalInfo` | object | Optional — see below |
| `createdAt` | ISO string | Creation timestamp |
| `updatedAt` | ISO string | Last update timestamp |
| `createdBy` | string | User ID of creator |

**medicalInfo sub-object:**
| Field | Type |
|---|---|
| `bloodType` | string |
| `allergies` | string[] |
| `conditions` | string[] |
| `medications` | string[] |
| `emergencyContact` | `{ name, relationship, phone }` |

**Relationships:** Child belongs to one or more guardians (via `parentId` and/or `guardians[]`). Child may belong to a school (via `schoolId` or `schoolName`).

**Dual relationship model:** Both `parentId` (direct FK) and `guardians[]` (array) coexist on the same record. This is a migration artefact — the system was mid-transition between models. Both are queried and deduplicated in `childrenApi.ts`.

**Lifecycle:** Created by parent or admin. Updated by parent, school (limited), or admin. Deleted by parent or admin.

**Ownership:** Parent owns their children's records. School can read enrolled children. Authority can read all children. Admin can read/write all.

**Sensitive data categories present:** Full name, date of birth, photograph, identification number, home address, medical information, emergency contact details.

---

## Entity: alerts

**Purpose:** Stores missing child or emergency alerts raised by parents or authorities.

**Fields (evidenced by `src/types/child.ts` — ChildAlert interface, and multiple API routes):**
| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `childId` | string | FK to children |
| `childName` | string | Denormalised child name |
| `childAge` | number | Denormalised child age |
| `childPhoto` | string | Denormalised child photo URL |
| `alertType` | string | Alert type (newer field) |
| `type` | string | Alert type (older field — duplicate) |
| `status` | string | `active`, `resolved`, `cancelled`, `false` |
| `description` | string | Alert description |
| `lastSeen` | object | Nested: `{ date, time, location, description }` |
| `lastSeenLocation` | string | Flat field (legacy) |
| `lastSeenWearing` | string | Flat field (legacy) |
| `lastSeenDate` | string | Flat field (legacy) |
| `lastSeenTime` | string | Flat field (legacy) |
| `clothingDescription` | string | Additional flat field |
| `contactPhone` | string | Contact number |
| `contactInfo` | string | Contact info (duplicate of contactPhone) |
| `additionalInfo` | string | Additional details |
| `createdBy` | string | User ID of creator |
| `createdAt` | ISO string | Creation timestamp |
| `updatedAt` | ISO string | Last update timestamp |
| `resolvedAt` | ISO string | Optional — resolution timestamp |
| `resolvedBy` | string | Optional — user ID who resolved |
| `resolutionDetails` | string | Optional — resolution notes |
| `attachments` | string[] | Optional — file URLs |

**Dual schema:** Both a nested `lastSeen` object and flat `lastSeenLocation/lastSeenWearing/lastSeenDate` fields coexist. `alertUtils.ts` normalises between them on read.

**Duplicate type field:** Both `alertType` and `type` store the same value. Queries check both.

**Lifecycle:** Created with `status: active`. Updated to `resolved`, `cancelled`, or `false` (false alarm). `resolvedAt` set when status changes to `resolved`.

**Ownership:** Created by parent, authority, or admin. Updated by creator, authority, or admin. Deleted by admin only.

**Sensitive data categories present:** Child identity (name, age, photo), last known location, clothing description, contact phone number.

---

## Entity: notifications

**Purpose:** In-app notifications for users.

**Fields (evidenced by `src/types/notification.ts`):**
| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `userId` | string | FK to users |
| `alertId` | string | Optional FK to alerts |
| `childId` | string | Optional FK to children |
| `type` | string | `alert`, `system`, `message` |
| `title` | string | Notification title |
| `message` | string | Notification body |
| `read` | boolean | Read status |
| `createdAt` | ISO string | Creation timestamp |
| `priority` | string | `low`, `medium`, `high` |

**Lifecycle:** Created by system. Marked as read by user. No deletion mechanism found.

---

## Entity: activities

**Purpose:** Activity log for user actions.

**Fields (evidenced by `src/types/common.ts`):**
| Field | Type | Notes |
|---|---|---|
| `id` | string | Firestore document ID |
| `type` | string | `alert`, `profile`, `login`, `system` |
| `title` | string | Activity title |
| `description` | string | Activity description |
| `timestamp` | ISO string | When it occurred |
| `userId` | string | FK to users |
| `status` | string | `success`, `warning`, `error`, `info` |

---

## Entity: audit_logs

**Purpose:** Audit trail for sensitive operations.

**Fields (evidenced by `src/app/api/admin-sdk/users/route.ts`):**
| Field | Type | Notes |
|---|---|---|
| `userId` | string | Who performed the action |
| `userRole` | string | Their role |
| `operation` | string | What was done |
| `resourceId` | string | What was affected |
| `resourceType` | string | Type of resource |
| `timestamp` | ISO string | When |
| `details` | string | Description |

**Note:** Audit logs are written server-side only. Firestore rules set `allow write: if false` for client-side writes. Only user creation is evidenced as being logged — other operations may not be.

---

## Entity: schools

**Purpose:** School organisation records.

**Fields (evidenced by `firestore.rules` and `src/types/user.ts` — Organization interface):**
| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `type` | string (`school`) |
| `address` | string |
| `contactInfo` | object `{ phone, email }` |

**Note:** No dedicated UI for creating or managing school records was found. School information is primarily stored denormalised on user profiles and child records.

---

## Entity: authorities

**Purpose:** Authority organisation records.

**Fields (evidenced by `firestore.rules`):**
Similar structure to schools. No dedicated UI found.

---

## Entity: cases

**Purpose:** Case records for authority users.

**Fields:** Unknown — collection exists in Firestore rules but no implementation found.

---

## Entity: reports

**Purpose:** Report records for admin and authority users.

**Fields:** Unknown — collection exists in Firestore rules but no implementation found.

---

## Entity: resources

**Purpose:** Unknown — collection exists in Firestore rules and a seed script exists (`src/scripts/seed-resources.js`) but no UI implementation found.

---

## Entity: settings

**Purpose:** Application-wide settings.

**Fields:** Unknown — collection exists in Firestore rules but no implementation found.

---

## Storage Structure

| Path | Content | Access |
|---|---|---|
| `childPhotos/{userId}/{childId}/` | Child photographs | Parent (own), school, authority, admin |
| `child-photos/{filename}` | Child photos (flat, server-write only) | All authenticated (read) |
| `users/{userId}/` | User profile photos | All authenticated (read), owner (write) |
| `profile-photos/{filename}` | Profile photos (flat, server-write only) | All authenticated (read) |
| `alerts/{alertId}/` | Alert attachments | All authenticated |
| `alert-attachments/{filename}` | Alert attachments (flat) | All authenticated |
| `reports/{reportId}/` | Report documents | Admin, authority |
| `schools/{schoolId}/` | School documents | Admin, school |
| `authorities/{authorityId}/` | Authority documents | Admin, authority |
| `system/` | System files | Admin only |

**Catch-all rule:** Any path not matched above allows read for all authenticated users and write for admin only.

---

## Data Model Problems Identified

1. **Dual parent-child relationship model:** `parentId` (direct FK) and `guardians[]` (array) coexist on child records. Both are queried and deduplicated.

2. **Dual alert type field:** `alertType` and `type` store the same value. Both are written and both are checked in queries.

3. **Dual alert location schema:** Nested `lastSeen` object and flat `lastSeenLocation/lastSeenWearing/lastSeenDate` fields coexist. Normalisation required on every read.

4. **Denormalised child data on alerts:** `childName`, `childAge`, `childPhoto` are copied onto alert records. These can become stale if the child profile is updated.

5. **School relationship inconsistency:** Children reference schools by both `schoolId` and `schoolName`. Users reference schools by `schoolId`, `schoolName`, and `organization.name`. Queries check different combinations.

6. **No cascade deletion:** No evidence of cascade deletion when a child is deleted (alerts, notifications referencing that child remain).

7. **No data retention policy:** No evidence of any retention or expiry mechanism.
