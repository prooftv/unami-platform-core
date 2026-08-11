# UNCIP_PRIVACY_AND_SAFEGUARDING.md
## Step 6 — Privacy, Security and Safeguarding Audit

This is an audit of the existing implementation. It is not legal advice and does not claim regulatory compliance or non-compliance.

Items marked **REQUIRES SAFEGUARDING/LEGAL REVIEW** require expert review before any production deployment handling real children's data.

---

## Data Categories Collected, Stored, and Transmitted

### Category 1: Child Identity Data
**Sensitivity: Very High**
- Full name (first name, last name)
- Date of birth
- Gender
- Photograph
- Identification number (SA ID number or birth certificate number)
- School name and school ID

**Where collected:** `ChildProfileForm` component, `/dashboard/parent/children/add`
**Where stored:** Firestore `children` collection, Firebase Storage (photographs)
**Who can access:** Parent (own children), school (enrolled children), authority (all), admin (all)
**Transmission:** Over HTTPS to Firebase/Firestore. Firebase is a Google Cloud service. No SA data residency.

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Collection of SA ID numbers and birth certificate numbers for children. Storage of child photographs. Data residency outside South Africa.

### Category 2: Child Medical Data
**Sensitivity: Very High**
- Blood type
- Allergies
- Medical conditions
- Medications
- Emergency contact name, relationship, and phone number

**Where collected:** `ChildProfileForm` (optional fields)
**Where stored:** Firestore `children.medicalInfo` sub-object
**Who can access:** Same as child identity data

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Medical data is a special category under POPIA. Collection, storage, and access controls require specific legal basis.

### Category 3: Child Location Data
**Sensitivity: High**
- Home address (street, city, province, postal code)
- Last seen location (from alerts)
- Last seen date and time

**Where collected:** `ChildProfileForm` (address), alert creation form (last seen)
**Where stored:** Firestore `children` collection (address), Firestore `alerts` collection (last seen)
**Who can access:** All authenticated users can read alerts (including last seen location)

### Category 4: Guardian/Parent Data
**Sensitivity: High**
- Full name
- Email address
- Phone number
- Home address
- Profile photograph

**Where collected:** Registration form, user profile
**Where stored:** Firestore `users` collection
**Who can access:** All authenticated users can read all user profiles

### Category 5: Authentication Credentials
**Sensitivity: Critical**
- Email addresses
- Passwords (stored in plaintext — see security concerns below)

**Where stored:** Firebase Authentication (hashed), Firestore `users` collection (plaintext)

---

## Security Concerns (Concrete Implementation Weaknesses)

### SC-1: Hardcoded Admin Credentials in Source Code
**Location:** `src/lib/auth.ts`
**Description:** The admin email address and password are hardcoded as string literals in the source code. Anyone with repository access has admin credentials.
**Severity:** Critical

### SC-2: Universal Backdoor Password
**Location:** `src/lib/auth.ts`
**Description:** The string `demo123` is accepted as a valid password for any email address. This creates an authenticated session with any role the user selects. This is documented on the login page UI as "New Users: any-email@example.com / demo123".
**Severity:** Critical

### SC-3: Plaintext Password Storage
**Location:** `src/lib/auth.ts`, Firestore `users` collection
**Description:** When users are created via the admin SDK, their password is stored in plaintext in the Firestore `users` document. The auth flow compares `userData.password === credentials.password` directly. The `check-password-storage.js` script in `/scripts/` confirms this was a known issue.
**Severity:** Critical

### SC-4: Unauthenticated Debug API Routes in Production
**Location:** `src/app/api/debug/`
**Description:** The following routes have no authentication check and are deployed to production:
- `GET /api/debug/users` — returns all user records including email addresses
- `GET /api/debug/alerts` — returns all alert records
- `GET /api/debug/children` — returns all child records including names, photos, addresses
- `GET /api/debug/env` — returns environment variable presence information
- `GET /api/debug/session` — returns session information
- `POST /api/debug/login` — accepts email and returns user record from Firebase Auth
- `POST /api/debug/children` — creates child records without authentication
- `PUT /api/debug/children` — updates child records without authentication
- `DELETE /api/debug/children` — deletes child records without authentication

These routes expose full read/write access to all child and user data without any authentication.
**Severity:** Critical

### SC-5: Alert Creation Without Authentication
**Location:** `src/app/api/parent/alerts/route.ts`
**Description:** The `/api/parent/alerts` POST route (used by the parent report form) has no session check. Any unauthenticated HTTP request can create an alert.
**Severity:** High

### SC-6: Debug Routes Used as Production Data Path
**Location:** Multiple dashboard pages
**Description:** The following production pages fetch data from unauthenticated debug endpoints:
- `src/app/dashboard/parent/report/page.tsx` — fetches children from `/api/debug/children`
- `src/app/dashboard/admin/alerts/page.tsx` — fetches alerts from `/api/debug/alerts`
- `src/app/dashboard/authority/alerts/page.tsx` — fetches alerts and children from `/api/debug/alerts` and `/api/debug/children`
- `src/app/dashboard/school/students/page.tsx` — fetches children from `/api/debug/children`
- `src/hooks/useAuth.ts` — fetches user profile from `/api/debug/users`

This means the primary data path for several dashboards bypasses all authentication.
**Severity:** Critical

### SC-7: Console Logging of Sensitive Information
**Location:** `src/lib/auth.ts`
**Description:** Password comparison results are logged to the console: `console.log('Password check:', { hasStoredPassword, passwordMatch, isDemoPassword })`. Session objects including user IDs and roles are also logged extensively.
**Severity:** Medium

### SC-8: All Users Can Read All User Profiles
**Location:** `firestore.rules`
**Description:** `allow read: if isSignedIn()` on the `users` collection means any authenticated user can read any other user's profile, including email address, phone number, address, and role.
**Severity:** Medium

### SC-9: All Authenticated Users Can Read All Child Records (Authority and Admin)
**Location:** `firestore.rules`, `src/app/api/admin-sdk/children/route.ts`
**Description:** Authority users can read all children in the system. This is by design for the alert response use case, but means authority users have access to the full identifying information of all registered children.
**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Whether this level of access is appropriate and what safeguards are required.

### SC-10: Missing Dependency
**Location:** `src/lib/utils/validation.ts`
**Description:** `zod` is imported but not listed in `package.json`. This will cause a runtime crash when validation functions are called.
**Severity:** Medium (functional, not security)

---

## File and Media Handling

**Child photographs:**
- Uploaded to Firebase Storage under `childPhotos/{userId}/{childId}/`
- URL stored in `children.photoURL`
- URL also denormalised onto alert records as `childPhoto`
- Accessible to all authenticated users via storage rules catch-all
- No evidence of image size limits enforced server-side
- No evidence of file type validation server-side

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Child photographs are the most sensitive data in the system. Access controls, retention, and transmission require specific review.

---

## Logging

**Evidenced by implementation:**
- Extensive `console.log` statements throughout API routes and auth code
- Audit log written to Firestore `audit_logs` collection for user creation only
- No evidence of audit logging for child record access, alert creation, or alert resolution

---

## Deletion

**Evidenced by implementation:**
- Users can be deleted by admin (removes from Firebase Auth and Firestore)
- Children can be deleted by parent or admin (removes from Firestore only)
- No cascade deletion: alerts, notifications, and activities referencing a deleted child remain

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Data subject deletion rights under POPIA require that deletion of a child's record also removes associated personal data from all collections.

---

## Retention

**No retention policy or mechanism found.** Data persists indefinitely unless manually deleted.

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Retention periods for child identity data, alert records, and audit logs must be defined and implemented.

---

## Third-Party Services Receiving UNCIP Information

| Service | Data transmitted | Notes |
|---|---|---|
| Firebase Authentication (Google) | Email addresses, display names, profile photos | Identity provider |
| Firebase Firestore (Google) | All application data including child records | Primary database |
| Firebase Storage (Google) | Child photographs, user photos, alert attachments | File storage |
| Vercel | Application code, environment variables | Deployment platform |
| GitHub | Source code | Source control |

**No SA data residency.** All Firebase services run on Google Cloud infrastructure. No South African region is available for Firebase.

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** Whether storage of children's personal data on Google Cloud infrastructure outside South Africa is permissible under POPIA and applicable government data sovereignty requirements.

---

## Consent

**No consent capture mechanism found.** No evidence of:
- Parental consent capture at child registration
- Terms of service acceptance
- Privacy policy acceptance
- Data processing consent

The registration page links to `/terms` and `/privacy-policy` but these routes do not exist in the repository.

**REQUIRES SAFEGUARDING/LEGAL REVIEW:** POPIA Section 26-27 requires specific consent for processing children's personal information. This must be implemented before any production deployment.
