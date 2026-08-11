# UNCIP_WORKFLOWS.md
## Step 4 — Workflow Extraction

Only workflows evidenced by the repository are documented here.

---

## Workflow 1: User Registration

**Status:** Implemented (with security concerns — see privacy document)

**Trigger:** User visits `/auth/register`

**Actor:** Any person (no pre-verification required)

**Input:**
- Full name
- Email address
- Password
- Confirm password
- Role selection: `parent`, `school`, `school/teacher`, `authority/ngo`, `community leader`

**System action:**
1. `createUserWithEmailAndPassword` called against Firebase Auth client SDK
2. POST to `/api/admin-sdk/users` with `isRegistration: true` flag (bypasses admin check)
3. Firebase Admin SDK creates user in Firebase Auth (duplicate — user already created in step 1)
4. Firebase Admin SDK creates user profile in Firestore `users` collection
5. Password is stored in plaintext in the Firestore user document (see security document)
6. Custom claims set on Firebase Auth user: `{ role, roles: [role] }`
7. `signInWithEmailAndPassword` called to sign in
8. Redirect to `/dashboard/[role]`

**Stored information:** User profile in Firestore `users` collection. Password in plaintext in Firestore.

**Resulting state:** User is authenticated and redirected to their role dashboard.

**Notifications:** None.

**Failure/edge cases:** If Firebase Auth creation succeeds but Firestore creation fails, the user exists in Auth but has no profile. Error is logged but not surfaced to user.

---

## Workflow 2: User Login

**Status:** Implemented (with security concerns — see privacy document)

**Trigger:** User visits `/auth/login` and submits credentials

**Actor:** Registered user

**Input:** Email, password, role selection (UI role buttons)

**System action (evidenced by `src/lib/auth.ts`):**
1. NextAuth credentials provider `authorize` function called
2. If email matches hardcoded admin email: password compared to hardcoded value
3. Otherwise: Firestore `users` collection queried by email
4. If found in Firestore: password compared in plaintext OR `demo123` accepted as universal password
5. If not found in Firestore: Firebase Auth `getUserByEmail` called
6. If found in Firebase Auth: role read from custom claims
7. If not found in Firebase Auth AND password is `demo123`: temporary user created with any role
8. JWT token created with `id`, `role`, `roles`
9. Redirect to `/dashboard/[role]`

**Stored information:** JWT session token (24-hour expiry).

**Resulting state:** User has an authenticated session.

**Failure/edge cases:** Multiple fallback paths. `demo123` password bypasses all authentication for any email address.

---

## Workflow 3: Child Profile Creation

**Status:** Implemented

**Trigger:** Parent navigates to `/dashboard/parent/children/add` and submits form

**Actor:** Parent (or admin)

**Input (from `src/components/forms/ChildProfileForm.tsx` and `src/types/child.ts`):**
- First name, last name (required)
- Date of birth (required)
- Gender (required)
- Identification number (optional — SA ID or birth certificate)
- School name / school ID (optional)
- Address: street, city, province, postal code (optional)
- Medical info: blood type, allergies, conditions, medications (optional)
- Emergency contact: name, relationship, phone (optional)
- Photograph (optional — upload to Firebase Storage)

**System action:**
1. POST to `/api/admin-sdk/children`
2. Session verified
3. Role checked: only `parent` or `admin` can create
4. `parentId` set to current user ID
5. `guardians[]` array set to include current user ID (dual model)
6. `createdBy` set to current user ID
7. Child document created in Firestore `children` collection

**Stored information:** Child profile in Firestore. Photo in Firebase Storage (if uploaded).

**Resulting state:** Child appears in parent's children list.

**Notifications:** None.

**Failure/edge cases:** Photo upload was reported as broken at time of archival (Firebase Storage conflicts).

---

## Workflow 4: Report Missing Child (Alert Creation)

**Status:** Implemented (notifications not sent)

**Trigger:** Parent navigates to `/dashboard/parent/report` and submits form

**Actor:** Parent

**Input (from `src/app/dashboard/parent/report/page.tsx`):**
- Child selection (from parent's registered children)
- Alert type: `missing`, `medical`, `danger`, `other`
- Description (required)
- Date last seen (required)
- Time last seen (required)
- Last seen location (required)
- Last seen wearing (optional)
- Contact information (required)

**System action:**
1. Children fetched from `/api/debug/children` (unauthenticated debug endpoint)
2. POST to `/api/parent/alerts` (no session check in this route)
3. Child document fetched from Firestore
4. Duplicate check: existing active alerts for same child and type
5. Alert document created in Firestore `alerts` collection with both nested and flat schema
6. Both `alertType` and `type` fields written with same value

**Stored information:** Alert in Firestore `alerts` collection.

**Resulting state:** Alert visible in admin and authority dashboards. Parent redirected to `/dashboard/parent/alerts`.

**Notifications:** None sent. No email, SMS, or push notification triggered.

**Failure/edge cases:** Duplicate alert (same child, same type, active) returns 409 error.

---

## Workflow 5: View Alerts (Authority)

**Status:** Partially implemented

**Trigger:** Authority user navigates to `/dashboard/authority/alerts`

**Actor:** Authority user

**System action:**
1. GET to `/api/debug/alerts` (unauthenticated debug endpoint)
2. All alerts returned (no jurisdiction filtering)
3. GET to `/api/debug/children` (unauthenticated debug endpoint) to fetch child details
4. Client-side filtering by status and type
5. Client-side pagination

**Resulting state:** Authority sees all alerts in the system regardless of jurisdiction.

**Note:** No jurisdiction-based filtering exists. Authority users see all alerts nationally.

---

## Workflow 6: View Alerts (Admin)

**Status:** Implemented

**Trigger:** Admin navigates to `/dashboard/admin/alerts`

**Actor:** Admin

**System action:** Same as authority — uses `/api/debug/alerts` and `/api/debug/children`.

---

## Workflow 7: Alert Resolution

**Status:** Partially implemented

**Trigger:** User with appropriate permissions updates alert status

**Actor:** Admin, authority, or alert creator

**System action:**
1. PUT to `/api/alerts/[id]`
2. Session verified
3. Permission check: admin or authority can update any alert; others can only update their own
4. Alert document updated in Firestore
5. If status changed to `resolved`: `resolvedAt` timestamp added

**Stored information:** Updated alert with new status, `resolvedAt`, `resolvedBy` (if set).

**Notifications:** None sent on resolution.

---

## Workflow 8: Admin User Management

**Status:** Implemented

**Trigger:** Admin navigates to `/dashboard/admin/users`

**Actor:** Admin

**Capabilities:**
- List all users with role filter and pagination
- View individual user profile
- Create new user (POST to `/api/admin-sdk/users`)
- Update user (PUT to `/api/admin-sdk/users`)
- Delete user (DELETE to `/api/admin-sdk/users` — deletes from both Firebase Auth and Firestore)

---

## Workflow 9: School Views Students

**Status:** Partially implemented

**Trigger:** School user navigates to `/dashboard/school/students`

**Actor:** School user

**System action:**
1. GET to `/api/debug/children` (unauthenticated debug endpoint)
2. All children returned (no school filtering applied)
3. All children displayed regardless of school association

**Note:** No school-based filtering is applied. School users see all children in the system.

---

## Workflows Described in Documentation But Not Implemented

The following workflows are described in `playbook/00-MASTER-PLAYBOOK.md` and `playbook/01-AGENT-TECHNICAL.md` but have no implementation in the repository:

| Workflow | Description |
|---|---|
| School confirms last seen | School receives alert notification, adds last-seen confirmation to alert |
| Authority assigns case number | Authority assigns SAPS case number to alert |
| Alert timeline | Multi-stakeholder response tracking with timestamped updates |
| Community sighting report | Community member reports sighting of missing child |
| Outbound notifications | Email or SMS sent to stakeholders when alert is created |
| Identification kit issuance | Generation or distribution of child identification document |
| Attendance integration | Link between school attendance and alert creation |
| Government system integration | LURITS, NCPR, SAPS CAS, EMIS connections |
