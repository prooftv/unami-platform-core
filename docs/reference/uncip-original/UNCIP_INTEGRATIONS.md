# UNCIP_INTEGRATIONS.md
## Step 8 — Integration Extraction

Only integrations actually present in the repository are documented here.

---

## Firebase Authentication

**Service:** Firebase Authentication (Google)
**Purpose:** User identity — email/password authentication, Google OAuth
**Direction:** Bidirectional — application creates/reads/updates/deletes user records
**Authentication method:** Firebase service account (private key) for Admin SDK; Firebase API key for client SDK
**Information transmitted:** Email addresses, display names, profile photo URLs, custom claims (role, roles[])
**Dependency:** `firebase` (client), `firebase-admin` (server)
**Current status:** Active but experiencing billing/subscription issues (documented in `playbook/00-MASTER-PLAYBOOK.md`)

---

## Firebase Firestore

**Service:** Firebase Firestore (Google Cloud)
**Purpose:** Primary application database
**Direction:** Bidirectional — all CRUD operations
**Authentication method:** Firebase service account for Admin SDK; Firebase API key + Auth token for client SDK
**Information transmitted:** All application data: user profiles, child records, alert records, notifications, activities, audit logs
**Dependency:** `firebase` (client), `firebase-admin` (server)
**Current status:** Active but experiencing billing/subscription issues

---

## Firebase Storage

**Service:** Firebase Storage (Google Cloud)
**Purpose:** File storage for photographs and documents
**Direction:** Bidirectional — upload and download
**Authentication method:** Firebase service account for Admin SDK; Firebase API key + Auth token for client SDK
**Information transmitted:** Child photographs, user profile photos, alert attachments
**Dependency:** `firebase` (client), `firebase-admin` (server)
**Current status:** Reported as broken at time of archival (Firebase Storage conflicts documented in `APP_CONTEXT.md`)

---

## Google OAuth

**Service:** Google OAuth 2.0
**Purpose:** Social login option
**Direction:** Inbound — Google authenticates user and returns profile
**Authentication method:** OAuth client ID and secret
**Information transmitted:** Google profile (name, email, profile picture, Google sub ID)
**Dependency:** `next-auth/providers/google`
**Current status:** Conditional — only active if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables are set. Unknown whether these are configured in production.

---

## NextAuth.js

**Service:** NextAuth.js (open source library)
**Purpose:** Session management, JWT token handling, OAuth orchestration
**Direction:** Internal — manages session state
**Authentication method:** `NEXTAUTH_SECRET` for JWT signing
**Information transmitted:** User ID, email, name, role, roles[] — stored in JWT token
**Dependency:** `next-auth`
**Current status:** Active

---

## Vercel

**Service:** Vercel
**Purpose:** Application deployment and hosting
**Direction:** Outbound — code deployed to Vercel
**Authentication method:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (GitHub Actions secrets)
**Information transmitted:** Application code, environment variables (stored in Vercel dashboard)
**Dependency:** Vercel CLI, GitHub Actions
**Current status:** Active (deployment pipeline configured)

---

## GitHub Actions

**Service:** GitHub Actions
**Purpose:** CI/CD — lint, build, deploy on push to main/master
**Direction:** Outbound — triggers Vercel deployment
**Authentication method:** GitHub repository secrets
**Information transmitted:** Source code
**Dependency:** `.github/workflows/deploy.yml`
**Current status:** Active

---

## Integrations Described in Documentation But Not Present in Code

The following integrations are described in `playbook/` documents but have no implementation in the repository:

| Integration | Described in | Status |
|---|---|---|
| Supabase (PostgreSQL) | `playbook/01-AGENT-TECHNICAL.md` | Planned migration — not implemented |
| SMS (Africa's Talking or Twilio) | `playbook/01-AGENT-TECHNICAL.md`, `docs-archive/HOLISTIC_ASSESSMENT.md` | Not implemented |
| Email notifications (Resend/SendGrid) | `playbook/01-AGENT-TECHNICAL.md` | Not implemented |
| LURITS (DBE learner tracking) | `playbook/02-AGENT-GOVERNMENT.md` | Not implemented |
| NCPR (National Child Protection Register) | `playbook/02-AGENT-GOVERNMENT.md` | Not implemented |
| SAPS CAS (Crime Administration System) | `playbook/02-AGENT-GOVERNMENT.md` | Not implemented |
| EMIS (Education Management Information System) | `playbook/02-AGENT-GOVERNMENT.md` | Not implemented |
| WhatsApp | Not in playbook code — mentioned in Q&A as what UNCIP is NOT | Not implemented |
| Mapping service | Not found | Not implemented |
