# UNCIP_PRODUCT_CONTEXT.md
## Step 2 — Product and Domain Extraction

Each item is classified:
- **Explicitly documented** — directly stated in source documentation
- **Evidenced by implementation** — represented by code/schema/workflows but not explicitly documented
- **Unknown** — cannot safely determine

---

## Product Name and Expansion

**Explicitly documented:** UNCIP = Unami National Child Identification Programme (also rendered as "Program" in some documents).

**Explicitly documented:** Built by the Unami Foundation.

---

## Product Purpose

**Explicitly documented** (from `playbook/00-MASTER-PLAYBOOK.md`):
> "A child identification and safety platform built for South African townships. The application connects parents, schools, and authorities to create a safer environment for children."

**Explicitly documented** (from `playbook/09-FULL-CONTEXT-HANDOFF.md`):
> "UNCIP is a digital platform for child safety in South African townships. It connects parents, schools, and authorities (SAPS) in real-time when a child is missing or at risk."

---

## Target Users

**Explicitly documented:**
- Parents and guardians of children
- School staff (principals, designated staff)
- Authorities (SAPS — South African Police Service, ward councillors, DSD offices)
- Community members (community champions, Community Policing Forum members)
- Administrators (Unami Foundation operators)

**Explicitly documented** (from `playbook/08-CORE-PHILOSOPHY.md`):
> "UNCIP is not a charity project. It is not 'helping' communities. It is building infrastructure that communities own and operate themselves."

---

## Intended Beneficiaries

**Explicitly documented:** Children in South African townships. Parents and families of those children.

**Explicitly documented** (from `playbook/00-MASTER-PLAYBOOK.md`):
> "South Africa has approximately 700 children reported missing every month."

---

## Child Identification Concept

**Evidenced by implementation:** The system allows parents to register child profiles containing identifying information: name, date of birth, gender, photograph, identification number (SA ID or birth certificate number), school, address, and medical information.

**Explicitly documented** (from `playbook/09-FULL-CONTEXT-HANDOFF.md`):
> "Child registration with ID numbers, photos, biometric potential."

**Unknown:** Whether "identification kit" as a physical or digital artefact was intended. The term appears in playbook documents but no implementation of a kit generation, printing, or distribution workflow exists in the repository.

---

## Missing Child Concept

**Explicitly documented** (from `playbook/00-MASTER-PLAYBOOK.md`):
> "Scenario: A 9-year-old girl in Khayelitsha doesn't come home from school. Her mother opens UNCIP on her phone. She sees the child's profile with photo, school info, and medical details. She taps 'Report Missing Child.'"

**Evidenced by implementation:** A parent can create an alert for a registered child. The alert captures: alert type, description, last seen date/time, last seen location, clothing description, and contact information.

**Evidenced by implementation:** Alerts have a status lifecycle: `active` → `resolved` / `cancelled` / `false`.

---

## Registration and Identification Workflows

**Evidenced by implementation:**
1. Parent registers account (email, password, role selection)
2. Parent creates child profile (name, DOB, gender, photo, ID number, school, address, medical info)
3. Parent can view, edit, and delete their children's profiles

**Unknown:** Whether there was an intended workflow for issuing a physical or digital identification document to the child after registration.

---

## Guardian/Family Relationships

**Evidenced by implementation:** A child can have multiple guardians. The system stores this as both a `guardians[]` array (legacy) and a `parentId` direct field (newer). Both are queried simultaneously.

**Evidenced by implementation:** The `guardians` join table concept is described in `playbook/01-AGENT-TECHNICAL.md` as the intended v2 model but is not implemented in the current repository.

**Unknown:** Whether the system was intended to support non-parent guardians (grandparents, foster carers, etc.) with different relationship types.

---

## Community/Operator Roles

**Evidenced by implementation:** A `community` role exists. The community dashboard is a placeholder with no implemented functionality.

**Explicitly documented** (from `playbook/09-FULL-CONTEXT-HANDOFF.md`):
> "Community champion, CPF member — Receive alert, report sighting."

**Unknown:** The exact intended capabilities of the community role beyond receiving alerts and reporting sightings.

---

## Institutional Roles

**Evidenced by implementation:** `school` role — intended to confirm child attendance and last-seen information when an alert is raised. Dashboard is partially implemented (students list via debug API, alerts list via debug API).

**Evidenced by implementation:** `authority` role — intended to receive alerts, assign case numbers, coordinate response. Dashboard is partially implemented (alerts list via debug API).

**Explicitly documented** (from `playbook/02-AGENT-GOVERNMENT.md`): Intended institutional connections include SAPS (South African Police Service), Department of Basic Education (DBE), Department of Social Development (DSD), ward councillors.

---

## Notifications

**Evidenced by implementation:** An in-app notification system exists. `useNotifications` hook sets up real-time Firestore listeners for a `notifications` collection. `NotificationBell` component displays unread count.

**Explicitly documented** (from `docs-archive/HOLISTIC_ASSESSMENT.md`):
> "Alert system lacks notification capabilities."

**Explicitly documented** (from `playbook/00-MASTER-PLAYBOOK.md`):
> "No email/SMS notifications" listed under "What Doesn't Work."

**Evidenced by implementation:** No outbound notification pathway (email, SMS, push) exists in the codebase. The `NEXT_PUBLIC_SMS_ENABLED` environment variable is referenced in documentation but no SMS implementation exists.

---

## Search and Retrieval

**Evidenced by implementation:** Authority dashboard has a search page (`/dashboard/authority/search`) but its implementation status is unknown — the page file exists but was not read.

**Evidenced by implementation:** Alert lists support client-side filtering by status and type. No server-side search implementation found.

---

## Reporting

**Evidenced by implementation:** Admin and authority dashboards have a reports page (`/dashboard/admin/reports`, `/dashboard/authority/reports`) but implementation status is unknown.

**Evidenced by implementation:** A `reports` collection exists in Firestore rules but no UI for creating or viewing reports was found in the read code.

---

## Alert Types

**Evidenced by implementation** (from `src/app/dashboard/parent/report/page.tsx`):
- `missing` — Missing Child
- `medical` — Medical Emergency
- `danger` — Danger Alert
- `other` — Other

**Evidenced by implementation** (from `src/app/dashboard/admin/alerts/page.tsx` filter buttons):
- `missing`, `emergency`, `medical`, `school`

**Note:** Alert type values are inconsistent between the creation form and the filter UI. This is a data model inconsistency.

---

## Government Alignment

**Explicitly documented** (from `playbook/08-CORE-PHILOSOPHY.md` and `playbook/02-AGENT-GOVERNMENT.md`):
- Children's Act 38 of 2005
- SA Schools Act 84 of 1996
- POPIA 2013
- National Development Plan 2030
- 4IR Strategy
- SDG 16 (Peace, Justice and Strong Institutions)

**Explicitly documented:** Intended integrations with LURITS (DBE), NCPR (DSD), SAPS CAS, EMIS (DBE). None of these integrations are implemented.

---

## Strategic Goal

**Explicitly documented** (from `playbook/09-FULL-CONTEXT-HANDOFF.md`):
> "Present UNCIP as a prototype to the Minister of Basic Education to secure funding for a 6-month pilot: 30 schools across 3 provinces, 3 SAPS stations, ~2,000 children registered. Budget: R2,400,000."

---

## What the Repository Does NOT Contain

The following concepts are mentioned in documentation but have no implementation:
- Identification kit generation or distribution
- SMS notifications
- Email notifications
- WhatsApp integration
- Geographic/map features
- Offline capability / PWA service worker
- SAPS case number auto-generation
- Integration with any government system (LURITS, NCPR, SAPS CAS, EMIS)
- Attendance tracking
- Community sighting reports
- Alert timeline (multi-stakeholder response tracking)
- Data export
- Consent capture workflow
