# UNCIP_EXTRACTION_SUMMARY.md
## Step 13 — Final Extraction Summary

**Entry point for future AI and engineering sessions.**

---

> This pack describes the original UNCIP repository as historical source material. It is not the v2 architecture and must not be interpreted as an implementation specification.

---

## What UNCIP Originally Was

UNCIP (Unami National Child Identification Programme) is a digital platform for child safety in South African townships. It connects parents, schools, and authorities in real-time when a child is missing or at risk.

Built by the Unami Foundation as a first vibe-coded prototype. The repository is architecturally inconsistent and contains significant technical debt, but the domain knowledge and product intent are clear and well-documented in the `/playbook/` directory.

The strategic goal is to present UNCIP to the South African Minister of Basic Education as a prototype for a government-funded pilot programme (30 schools, 3 provinces, ~2,000 children, R2.4M budget).

---

## What the Repository Actually Contains

A Next.js 13 (App Router) application with:
- Firebase (Auth + Firestore + Storage) as the backend
- NextAuth.js for session management
- Five role-based dashboards (parent, school, authority, community, admin)
- Child profile management (create, read, update, delete)
- Missing child alert creation and management
- Admin user management
- A UI component library
- A comprehensive strategic playbook (9 documents)

**What is functional:** Parent dashboard, admin dashboard, child profile creation, alert creation, alert listing (admin and authority), user management.

**What is placeholder:** School dashboard, authority dashboard, community dashboard.

**What is not implemented:** Outbound notifications, alert timeline, school confirms last-seen workflow, authority assigns case number workflow, community sighting reports, geographic scoping, offline capability, consent capture.

---

## Major Domain Concepts

1. **Child identity record** — The central entity. Contains identifying information, photograph, medical data, and links to guardians and school.

2. **Guardian relationship** — A parent or guardian is linked to one or more children. A child can have multiple guardians.

3. **School relationship** — A child is linked to a school. The school sees the child daily and can confirm attendance.

4. **Missing child alert** — Raised by a parent when a child is missing or at risk. Captures last-seen information. Has a status lifecycle (active → resolved/cancelled/false alarm).

5. **Multi-stakeholder response** — The core workflow: parent reports → school confirms last seen → authority coordinates response. Only the first step is implemented.

6. **Five roles** — parent, school, authority, community, admin. Each has a distinct relationship to child safety and a distinct dashboard experience.

7. **Self-determination principle** — Communities are the primary agents of child safety, not external organisations. Parents register their own children. Schools confirm. Communities mobilise. Authorities coordinate.

---

## Major Workflows

| Workflow | Status |
|---|---|
| User registration | Implemented (with security concerns) |
| User login | Implemented (with security concerns) |
| Child profile creation | Implemented (photo upload broken) |
| Report missing child | Implemented (no notifications sent) |
| View alerts (admin/authority) | Implemented (uses unauthenticated debug API) |
| Alert resolution | Partially implemented |
| Admin user management | Implemented |
| School confirms last seen | Not implemented |
| Authority assigns case number | Not implemented |
| Alert timeline | Not implemented |
| Community sighting report | Not implemented |
| Outbound notifications | Not implemented |

---

## Important Data Categories

All of the following are collected and stored in the original system:

- Child full name, date of birth, gender
- Child photograph
- Child SA ID number or birth certificate number
- Child home address
- Child school name and ID
- Child medical information (blood type, allergies, conditions, medications)
- Child emergency contact (name, relationship, phone)
- Guardian/parent full name, email, phone, address
- Last known location of missing child
- Alert contact phone numbers

**REQUIRES SAFEGUARDING/LEGAL REVIEW before any production deployment with real data.**

---

## Major Security and Safeguarding Concerns

These are concrete implementation weaknesses found in the source code:

1. **Hardcoded admin credentials in source code** — admin email and password are string literals in `src/lib/auth.ts`

2. **Universal backdoor password** — `demo123` is accepted for any email address, creating an authenticated session with any role

3. **Plaintext password storage** — user passwords stored in plaintext in Firestore `users` collection

4. **Unauthenticated debug API routes in production** — `/api/debug/*` routes expose full read/write access to all child and user data without authentication

5. **Production dashboards use unauthenticated debug APIs** — the primary data path for several dashboards bypasses all authentication

6. **Alert creation without authentication** — `/api/parent/alerts` has no session check

7. **No consent capture** — no parental consent mechanism for child data processing

8. **No cascade deletion** — deleting a child does not remove associated personal data

9. **No data retention policy** — data persists indefinitely

10. **No SA data residency** — all data stored on Google Cloud infrastructure outside South Africa

---

## Major Technical Debt

1. `zod` imported but not in `package.json` — runtime crash risk
2. Firebase Admin SDK initialised in multiple places
3. Three duplicate hooks for children data
4. Three duplicate API routes for children data
5. Dual parent-child relationship model (migration artefact)
6. Dual alert schema (migration artefact)
7. No test suite
8. ~50 root-level markdown fix logs creating noise
9. Debug routes used as production data path
10. Hardcoded Codespaces URL in constants

---

## Important Integrations

**Active:** Firebase Auth, Firebase Firestore, Firebase Storage, NextAuth.js, Vercel, GitHub Actions

**Planned but not implemented:** Supabase (PostgreSQL), SMS notifications, email notifications, LURITS, NCPR, SAPS CAS, EMIS

**Not present:** WhatsApp, mapping services, any government system integration

---

## What Appears Worth Preserving

- The five-role domain model
- The child identity record structure (with data model improvements)
- The guardian relationship concept (redesigned as join table)
- The alert lifecycle model
- The multi-stakeholder response intent
- The server-side API route pattern
- The role-based middleware route protection
- The UI component library
- The TypeScript type definitions
- The strategic playbook documents (all 9)
- The self-determination philosophy

---

## What Requires Reconsideration

- Authentication architecture (Firebase + NextAuth → Supabase Auth only)
- Data model (dual schemas → single normalised schemas)
- Access control (all users read all alerts → geographic/jurisdictional scoping)
- School and authority dashboard functionality (placeholder → real implementation)
- Community role scope (undefined → deliberate decision required)
- Alert type taxonomy (inconsistent → single agreed taxonomy)
- Notification architecture (none → email/SMS via Supabase Edge Functions)

---

## What Should Not Be Carried Forward Automatically

- Hardcoded credentials
- `demo123` backdoor
- Plaintext password storage
- Debug API routes
- Firebase as the backend
- NextAuth.js as a session layer on top of Supabase Auth
- Duplicate hooks and routes
- Dual data model schemas
- Test pages in `/public/`
- Debug links in production navigation

---

## Unknowns Requiring Founder Clarification

1. **Identification kit** — The product name includes "Identification Programme." Was a physical or digital identification kit (card, document, QR code) intended? No implementation exists.

2. **`cases` collection** — Was this intended to mirror SAPS case records or to be a separate UNCIP case management system?

3. **`reports` collection** — What type of reports? Statistical? Incident? For whom?

4. **`resources` collection** — What resources? Community resources? Educational materials? For which role?

5. **Community role scope** — What exactly should community members be able to do? Report sightings only? Receive alerts? Participate in response?

6. **Alert geographic scoping** — Should alerts be visible nationally, by province, by SAPS station area, or by some other boundary?

7. **School user onboarding** — Should school users self-register, be invited, or be created by admin? Currently any person can register as a school user.

8. **Authority user onboarding** — Same question. Currently any person can register as an authority user.

9. **Data retention** — How long should child records, alert records, and audit logs be retained?

10. **Consent model** — What specific consent is required at child registration? Who gives consent? How is it recorded?

---

## Recommended Next Step

**Architectural review of this extraction pack.**

The extraction pack should be reviewed by the founder and any relevant advisors to:
1. Confirm or correct the domain concepts
2. Answer the unknowns listed above
3. Make deliberate decisions about what survives into v2
4. Define the safeguarding and privacy requirements before any implementation begins

**Do not begin UNCIP v2 implementation until this extraction pack has been reviewed and accepted.**

The security and safeguarding concerns documented in `UNCIP_PRIVACY_AND_SAFEGUARDING.md` must be addressed by design in v2 before any real children's data is handled.
