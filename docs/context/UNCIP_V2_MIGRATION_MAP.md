# UNCIP_V2_MIGRATION_MAP.md
## Step 12 — V2 Migration Map

This document classifies original system concepts for v2. It is NOT a technical implementation plan.

Classifications:
- **PRESERVE** — Domain/product concepts that clearly survive
- **RECONSIDER** — Valuable concepts whose implementation or behaviour requires architectural review
- **RETIRE** — Concepts/implementations that should not automatically survive
- **UNKNOWN** — Future cannot yet be determined

---

## Domain Concepts

| Concept | Classification | Reason |
|---|---|---|
| Five user roles (parent, school, authority, community, admin) | PRESERVE | Core domain model. All five roles represent real stakeholders in child safety. |
| Child identity record (name, DOB, gender, photo, ID number, school) | PRESERVE | Central entity. Represents the child's identifying information. |
| Guardian relationship (parent/guardian linked to child) | PRESERVE | Core relationship. Must be redesigned as a proper join table, not an array field. |
| School relationship (child linked to school) | PRESERVE | Core relationship. School is the institution that sees the child daily. |
| Missing child alert | PRESERVE | Core workflow. The primary safety mechanism. |
| Alert status lifecycle (active → resolved/cancelled/false alarm) | PRESERVE | Correct model. Status names may be refined. |
| Multi-stakeholder alert response (parent → school → authority) | PRESERVE | Core product intent. Not yet implemented but clearly the right model. |
| Alert timeline (record of who did what) | PRESERVE | Not implemented but essential for the product to deliver its value. |
| Medical information on child profile | PRESERVE | Valuable for emergency response. Requires appropriate access controls. |
| Emergency contact on child profile | PRESERVE | Valuable for emergency response. |
| Role-based dashboard routing | PRESERVE | Correct pattern. Each role has a distinct experience. |
| Admin role-switching for demonstration | PRESERVE | Useful for demos and support. |
| Duplicate alert prevention | PRESERVE | Correct business logic. |

---

## Authentication and Session

| Concept | Classification | Reason |
|---|---|---|
| Email/password authentication | PRESERVE | Primary auth method for the target context. |
| Role stored in session/token | PRESERVE | Needed for route protection and API access control. |
| Google OAuth | RECONSIDER | May be useful for school and authority users. Evaluate whether it fits the target user context. |
| NextAuth.js as session layer | RETIRE | Adds complexity on top of Firebase Auth. In v2 with Supabase, Supabase Auth handles sessions natively. |
| Firebase Authentication | RETIRE | Being replaced by Supabase Auth. |
| Hardcoded admin credentials | RETIRE | Critical security concern. Must not survive. |
| `demo123` universal backdoor | RETIRE | Critical security concern. Must not survive. |
| Plaintext password storage | RETIRE | Critical security concern. Must not survive. |
| Role selector at login | RECONSIDER | Useful for demos. In production, role should come from the user's profile, not be selected at login. |

---

## Data Layer

| Concept | Classification | Reason |
|---|---|---|
| Firebase Firestore | RETIRE | Being replaced by PostgreSQL (Supabase). No SA data residency. Not self-hostable. |
| Firebase Storage | RETIRE | Being replaced by Supabase Storage. |
| Firebase Admin SDK | RETIRE | Being replaced by Supabase server client. |
| Server-side data access pattern (API routes with privileged client) | PRESERVE | Correct architectural pattern. Implementation changes, pattern survives. |
| Dual parent-child relationship model | RETIRE | Migration artefact. Replace with proper join table. |
| Dual alert schema (nested + flat) | RETIRE | Migration artefact. Replace with single normalised schema. |
| Dual alert type field | RETIRE | Replace with single `alert_type` field. |
| Denormalised child data on alerts | RECONSIDER | Avoids joins but creates stale data risk. Evaluate whether joins are acceptable in v2. |
| Audit log collection | PRESERVE | Correct pattern. Needs to be expanded to cover more operations. |
| `cases` collection | UNKNOWN | Unclear purpose. Requires founder clarification before including in v2. |
| `reports` collection | UNKNOWN | Unclear purpose. Requires founder clarification before including in v2. |
| `resources` collection | UNKNOWN | Unclear purpose. Requires founder clarification before including in v2. |

---

## API Layer

| Concept | Classification | Reason |
|---|---|---|
| `/api/admin-sdk/*` pattern (authenticated server routes) | PRESERVE | Correct pattern. Rename and reimplement with Supabase. |
| `/api/debug/*` routes | RETIRE | Critical security concern. Must not exist in v2. |
| `/api/parent/alerts` (no auth check) | RETIRE | Security concern. All routes must require authentication. |
| Duplicate API routes | RETIRE | Single API layer in v2. |
| `isRegistration` flag to bypass admin check | RETIRE | Security concern. Registration should use a separate, properly scoped endpoint. |

---

## Access Control

| Concept | Classification | Reason |
|---|---|---|
| Role + relationship based access control | PRESERVE | Correct model. Parent sees own children; school sees enrolled children; authority sees all. |
| Row-level security | PRESERVE | Must be implemented at the database level (PostgreSQL RLS) in v2. |
| All users can read all user profiles | RETIRE | PII exposure. In v2, restrict to own profile + admin. |
| All users can read all alerts | RECONSIDER | Appropriate for community sighting use case but needs geographic scoping. |
| School users see all children (no filter) | RETIRE | Bug. School users should only see children enrolled at their school. |
| Authority users see all alerts (no jurisdiction) | RECONSIDER | May be appropriate nationally but requires deliberate decision. |

---

## UI and UX

| Concept | Classification | Reason |
|---|---|---|
| Role-based dashboards | PRESERVE | Core UX pattern. |
| UI component library | PRESERVE | Reusable and well-structured. |
| Mobile-first responsive design | PRESERVE | Essential for township context. |
| Child profile form | PRESERVE | Core UX. Reimplement with updated data model. |
| Missing child report form | PRESERVE | Core UX. Add alert type selector, improve field structure. |
| Alert list with status and type filters | PRESERVE | Useful UX pattern. |
| `demo123` instructions on login page | RETIRE | Must not appear in any production interface. |
| Link to `/auth-debug` in school/community dashboards | RETIRE | Debug links must not appear in production. |
| Test HTML files in `/public/` | RETIRE | Must not be deployed to production. |

---

## Infrastructure

| Concept | Classification | Reason |
|---|---|---|
| Next.js (App Router) | PRESERVE | Correct framework for this application. |
| TypeScript | PRESERVE | Correct choice for a safety-critical application. |
| Tailwind CSS | PRESERVE | Correct styling approach. |
| Vercel deployment | PRESERVE | Appropriate for prototype/demo phase. |
| GitHub Actions CI/CD | PRESERVE | Correct deployment pipeline. |
| PWA / offline capability | PRESERVE (not yet implemented) | Essential for township context with poor connectivity. Must be implemented in v2. |
| Self-hostable architecture | PRESERVE (not yet implemented) | Required for government data sovereignty. Supabase enables this. |

---

## Strategic Documents

| Item | Classification | Reason |
|---|---|---|
| `/playbook/` (all 9 documents) | PRESERVE | Product strategy, government alignment, pilot design, budget, legal framework. These are the authoritative product intent documents. |
| Root-level markdown fix logs (~50 files) | RETIRE | Development diary. Not specifications. Create noise. |
| `/docs-archive/` (23 files) | RECONSIDER | Some contain useful historical context (HOLISTIC_ASSESSMENT.md, FIREBASE_SECURITY_REPORT.md). Most are outdated fix logs. |
