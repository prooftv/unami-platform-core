# UNCIP_ORIGINAL_ARCHITECTURE_AUDIT.md
## Step 9 — Architectural Audit

Classifications used:
- **DOMAIN FACT** — Genuine UNCIP concept that should be understood
- **PRODUCT INTENT** — Evidence of the original product intention
- **VALID PATTERN** — Implementation approach potentially worth preserving
- **LEGACY IMPLEMENTATION** — Existing implementation that should not automatically survive
- **TECHNICAL DEBT** — Concrete implementation weakness
- **SECURITY CONCERN** — Security/safeguarding issue requiring redesign
- **UNKNOWN** — Meaning or intent cannot safely be determined
- **DEPRECATED** — Clearly obsolete or abandoned

---

## Domain Concepts

**DOMAIN FACT:** Five distinct user roles exist with different relationships to child safety: parent (registers and owns child data), school (confirms attendance and last-seen), authority (coordinates response), community (reports sightings), admin (operates the platform).

**DOMAIN FACT:** A child's identity record is the central entity. It contains identifying information, a photograph, medical information, and links to guardians and school.

**DOMAIN FACT:** An alert is raised when a child is missing or at risk. It captures last-seen information and triggers a coordinated response across roles.

**DOMAIN FACT:** The guardian relationship is many-to-many: a child can have multiple guardians; a guardian can have multiple children.

**DOMAIN FACT:** The school relationship links a child to an institution that sees them daily and can confirm attendance.

**DOMAIN FACT:** Alert resolution is a distinct state change that closes the active alert and records how it was resolved.

**DOMAIN FACT:** The system is intended for South African townships. SA-specific context (SAPS, LURITS, NCPR, POPIA, Children's Act) is central to the product.

---

## Product Intent

**PRODUCT INTENT:** The three-role response flow (parent reports → school confirms → authority responds) is the core product workflow. It is described in detail in the playbook but only partially implemented.

**PRODUCT INTENT:** Real-time notifications to school and authority when an alert is created are the primary value proposition. They are not implemented.

**PRODUCT INTENT:** An alert timeline showing multi-stakeholder responses with timestamps is intended. It is not implemented.

**PRODUCT INTENT:** The system is intended to be presented to the South African Minister of Basic Education as a prototype for a government-funded pilot programme.

**PRODUCT INTENT:** The system is intended to be self-hostable on government-approved infrastructure (SITA) for data sovereignty reasons. Firebase does not support this.

**PRODUCT INTENT:** Supabase (PostgreSQL) was chosen as the migration target specifically because it is self-hostable and open-source. The migration plan exists in `playbook/01-AGENT-TECHNICAL.md` but is not implemented.

---

## Valid Patterns

**VALID PATTERN:** Server-side data access via privileged API routes (the `admin-sdk` pattern). Using server-side routes to access the database rather than direct client-side queries is architecturally sound. The specific Firebase Admin SDK implementation should not survive, but the pattern should.

**VALID PATTERN:** Role-based middleware route protection (`src/middleware.ts`). The logic of protecting routes by role and redirecting to the appropriate dashboard is correct and well-implemented.

**VALID PATTERN:** Hybrid access control combining role-based and relationship-based checks (e.g., parent can only access their own children). This is the correct model for this domain.

**VALID PATTERN:** The UI component library (`src/components/ui/`). The component set is reusable and well-structured.

**VALID PATTERN:** TypeScript type definitions (`src/types/`). The domain types are well-defined and accurately represent the domain model.

**VALID PATTERN:** Alert normalisation utility (`src/lib/utils/alertUtils.ts`). The concept of a normalisation layer for inconsistent data is valid, even though the inconsistency it addresses should not exist in v2.

**VALID PATTERN:** Duplicate alert prevention (checking for existing active alerts of the same type for the same child before creating a new one).

---

## Legacy Implementations

**LEGACY IMPLEMENTATION:** Firebase as the database and storage backend. The playbook explicitly documents the decision to migrate to Supabase. Firebase has no SA data residency, is not self-hostable, and has caused billing issues.

**LEGACY IMPLEMENTATION:** NextAuth.js as the session layer on top of Firebase Auth. Running two authentication systems simultaneously creates confusion and inconsistency. The intended v2 architecture uses Supabase Auth only.

**LEGACY IMPLEMENTATION:** The dual parent-child relationship model (`parentId` + `guardians[]`). This is a migration artefact from an earlier schema. The intended model is a proper `guardians` join table.

**LEGACY IMPLEMENTATION:** The dual alert schema (nested `lastSeen` object + flat fields). This is a migration artefact. The intended model is a single normalised schema.

**LEGACY IMPLEMENTATION:** The dual alert type field (`alertType` + `type`). Same value written to two fields. Should be a single field.

**LEGACY IMPLEMENTATION:** Firebase Admin SDK initialised in multiple places. `admin-singleton.ts` attempts to solve this with a singleton pattern, but `admin-sdk/alerts/route.ts` and `admin-sdk/users/route.ts` also initialise the SDK directly.

**LEGACY IMPLEMENTATION:** Three duplicate hooks for children data: `useChildren`, `useChildProfiles`, `useAdminSdk`. They use different data paths and can return inconsistent results.

**LEGACY IMPLEMENTATION:** Duplicate API routes: `/api/admin-sdk/children`, `/api/children`, `/api/debug/children` all provide children data through different paths with different authentication requirements.

---

## Technical Debt

**TECHNICAL DEBT:** `zod` is imported in `src/lib/utils/validation.ts` but is not in `package.json`. This will cause a runtime crash when validation functions are called.

**TECHNICAL DEBT:** The `/dashboard/parent/children/page.tsx` route redirects to `/dashboard/parent/profile` instead of showing children. The children management was moved to the profile page but the route was not updated — it just redirects.

**TECHNICAL DEBT:** The school students page (`/dashboard/school/students`) fetches all children from the debug API with no school filtering. School users see all children in the system.

**TECHNICAL DEBT:** `src/lib/constants.ts` contains a hardcoded Codespaces URL as the `BASE_URL` fallback: `https://probable-yodel-q7x675676vqpc6v5-3002.app.github.dev`.

**TECHNICAL DEBT:** Approximately 50 root-level markdown files are development diary entries (fix logs, status updates). These are not specifications and create significant noise.

**TECHNICAL DEBT:** No test suite exists anywhere in the repository.

**TECHNICAL DEBT:** The `reference/` directory contains conflicting rules and legacy routes that are no longer used but remain in the repository.

**TECHNICAL DEBT:** Public test HTML/JS files (`public/test-admin-alert.html`, `public/test-alert.html`, etc.) are deployed to production.

**TECHNICAL DEBT:** Multiple shell scripts at the root level (`clean-and-push.sh`, `clean-history.sh`, `clean-repo.sh`, etc.) suggest repeated attempts to clean the repository history.

**TECHNICAL DEBT:** `src/app/api/admin-sdk/alerts/route.ts.bak` and `src/app/api/alerts/[id]/route.ts.bak` — backup files committed to the repository.

**TECHNICAL DEBT:** The `node` file at the repository root is unknown — likely an accidentally committed binary or symlink.

---

## Security Concerns

**SECURITY CONCERN:** Hardcoded admin credentials in source code (`src/lib/auth.ts`). See `UNCIP_PRIVACY_AND_SAFEGUARDING.md` SC-1.

**SECURITY CONCERN:** Universal `demo123` backdoor password (`src/lib/auth.ts`). See SC-2.

**SECURITY CONCERN:** Plaintext password storage in Firestore. See SC-3.

**SECURITY CONCERN:** Unauthenticated debug API routes deployed to production with full read/write access to child and user data. See SC-4.

**SECURITY CONCERN:** Alert creation endpoint (`/api/parent/alerts`) has no authentication check. See SC-5.

**SECURITY CONCERN:** Production dashboards use unauthenticated debug endpoints as their primary data path. See SC-6.

**SECURITY CONCERN:** No consent capture for child data processing. See `UNCIP_PRIVACY_AND_SAFEGUARDING.md`.

**SECURITY CONCERN:** No cascade deletion — child data persists in alerts and notifications after child record deletion.

**SECURITY CONCERN:** All authenticated users can read all user profiles (PII exposure).

---

## Unknown

**UNKNOWN:** The `node` file at the repository root. Cannot determine what this is.

**UNKNOWN:** The implementation status of `/dashboard/authority/cases`, `/dashboard/authority/reports`, `/dashboard/authority/search`, `/dashboard/admin/activities`, `/dashboard/admin/reports`, `/dashboard/admin/settings`. These routes exist but their page files were not read.

**UNKNOWN:** Whether the `resources` collection was intended for community resources, educational materials, or something else.

**UNKNOWN:** Whether the `cases` collection was intended to mirror SAPS case records or to be a separate UNCIP case management system.

**UNKNOWN:** The intended behaviour of the "Remember me" checkbox on the login page. No implementation found.

---

## Deprecated

**DEPRECATED:** `src/hooks/useTestAuth.ts` — contains hardcoded test credentials. Should not exist.

**DEPRECATED:** `src/app/api/admin-sdk/check/route.ts` — unauthenticated health check endpoint.

**DEPRECATED:** `src/app/test-auth/page.tsx` — test authentication page.

**DEPRECATED:** `reference/` directory — legacy routes and conflicting rules.

**DEPRECATED:** All `/scripts/` Firebase admin scripts — Firebase-specific, not needed in v2.

**DEPRECATED:** `src/lib/firebase/admin-direct.ts` — another Firebase Admin SDK initialisation file (not read but evidenced by directory listing).
