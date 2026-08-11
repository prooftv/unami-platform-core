# UNCIP_ORIGINAL_DECISIONS.md
## Step 10 — Decisions and Assumptions

Each decision is classified as:
- **Explicit decision** — directly stated in documentation
- **Inferred implementation choice** — evidenced by code but not explicitly documented

---

## D1: Firebase as the Backend

**Classification:** Explicit decision (documented in `playbook/08-CORE-PHILOSOPHY.md`)

**Decision:** Firebase (Auth + Firestore + Storage) was chosen as the backend for the prototype.

**Documented rationale:** Not explicitly stated for the original choice. The playbook documents the decision to migrate away from Firebase, citing: billing issues, no SA data residency, not self-hostable, vendor lock-in, unpredictable pricing.

**Documented outcome:** Firebase billing/subscription issues were encountered. The playbook explicitly plans migration to Supabase.

---

## D2: NextAuth.js for Session Management

**Classification:** Inferred implementation choice

**Decision:** NextAuth.js was added on top of Firebase Auth to provide server-side session management readable by Next.js middleware.

**Inferred rationale:** Next.js App Router middleware cannot read Firebase Auth tokens directly. NextAuth provides a JWT token that middleware can read via `getToken()`.

**Outcome:** Two authentication systems run simultaneously. Firebase Auth handles identity; NextAuth handles sessions. This creates inconsistency and complexity.

---

## D3: Supabase as Migration Target

**Classification:** Explicit decision (documented in `playbook/01-AGENT-TECHNICAL.md` and `playbook/08-CORE-PHILOSOPHY.md`)

**Decision:** Supabase (PostgreSQL) was chosen as the v2 backend.

**Documented rationale:** Self-hostable (data sovereignty), PostgreSQL (government-trusted, auditable), open source, predictable pricing, SA data residency possible, no vendor lock-in.

**Status:** Migration planned but not implemented.

---

## D4: Dual Parent-Child Relationship Model

**Classification:** Inferred implementation choice

**Decision:** Both `parentId` (direct FK) and `guardians[]` (array) are maintained simultaneously on child records.

**Inferred rationale:** The system was mid-migration from the array model to the direct FK model. Backward compatibility was maintained during the transition.

**Outcome:** Both fields must be queried and results deduplicated. Data model is inconsistent.

---

## D5: Dual Alert Schema

**Classification:** Inferred implementation choice

**Decision:** Both a nested `lastSeen` object and flat `lastSeenLocation/lastSeenWearing/lastSeenDate` fields are written to alert records.

**Inferred rationale:** The schema evolved during development. Old alerts had flat fields; new alerts had nested. Both structures were maintained for backward compatibility.

**Outcome:** `alertUtils.ts` normalisation required on every alert read.

---

## D6: Debug Routes as Production Data Path

**Classification:** Inferred implementation choice

**Decision:** Several production dashboard pages fetch data from `/api/debug/*` endpoints rather than the authenticated `/api/admin-sdk/*` endpoints.

**Inferred rationale:** The debug endpoints were more reliable during development (no auth complexity). They were never replaced with authenticated equivalents before the dashboards were considered "working."

**Outcome:** Production dashboards bypass authentication. This is a critical security concern.

---

## D7: Role Selector on Login Page

**Classification:** Inferred implementation choice

**Decision:** The login page shows role selector buttons that set the role passed to NextAuth. The user selects their role at login, not just at registration.

**Inferred rationale:** Allows the admin to log in as different roles for demonstration. Also allows `demo123` users to select any role.

**Outcome:** Any user can claim any role at login if they know the `demo123` password.

---

## D8: isRegistration Flag to Bypass Admin Check

**Classification:** Inferred implementation choice

**Decision:** The `/api/admin-sdk/users` POST route accepts an `isRegistration: true` flag that bypasses the admin permission check, allowing unauthenticated user creation.

**Inferred rationale:** The registration flow needs to create a user profile without the user being authenticated yet.

**Outcome:** Any unauthenticated request with `isRegistration: true` can create a user account.

---

## D9: Denormalised Child Data on Alerts

**Classification:** Inferred implementation choice

**Decision:** `childName`, `childAge`, and `childPhoto` are copied onto alert records at creation time.

**Inferred rationale:** Avoids a join query when displaying alerts. Alert lists can show child information without fetching the child record.

**Outcome:** Child data on alerts can become stale if the child profile is updated after the alert is created.

---

## D10: All Authenticated Users Can Read All Alerts

**Classification:** Inferred implementation choice

**Decision:** The Firestore rules and API routes allow all authenticated users to read all alerts.

**Inferred rationale:** All dashboards need alert data. Simplest implementation.

**Outcome:** No geographic or jurisdictional scoping. Authority users see all alerts nationally. Community users see all alerts nationally.

---

## D11: Admin Role Switching

**Classification:** Explicit decision (evidenced by `RoleSwitcher` component and `playbook/09-FULL-CONTEXT-HANDOFF.md`)

**Decision:** The admin user can switch their active role to view any dashboard.

**Documented rationale:** Used for demonstration purposes — a single admin account can demonstrate all role experiences.

**Outcome:** Useful for demos. The `updateSession()` mechanism works correctly.

---

## D12: Government Targeting Strategy

**Classification:** Explicit decision (documented in `playbook/08-CORE-PHILOSOPHY.md`)

**Decision:** Target the Department of Basic Education (DBE) rather than SAPS or DSD.

**Documented rationale:** Schools see every child every day. DBE has existing budget lines UNCIP fits into. SAPS is operationally overwhelmed. DSD is underfunded.

---

## Assumptions That Cannot Be Confirmed

The following appear to be assumptions made during development that cannot be confirmed from the repository:

1. **Assumption:** The `community` role would eventually have functionality for reporting sightings. No implementation exists and no specification was found.

2. **Assumption:** The `cases` and `reports` collections would eventually have UI. No implementation exists.

3. **Assumption:** The `resources` collection would be used for community resources or educational materials. The seed script exists but no UI or specification was found.

4. **Assumption:** Photo upload would work reliably. It was reported as broken at time of archival.

5. **Assumption:** The `demo123` backdoor would be removed before production. It remains in the codebase and is documented on the login page.
