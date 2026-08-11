# UNCIP_ORIGINAL_REPOSITORY.md
## Step 1 — Repository Inventory

**Source examined:** `/workspaces/uncip-2026`
**Purpose:** Factual inventory only. No architectural judgement in this document.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 13.4.12 (App Router) |
| Language | TypeScript | 5.1.6 |
| Runtime | Node.js | 18 (per CI config) |
| Styling | Tailwind CSS | 3.3.3 |
| Auth (session) | NextAuth.js | 4.22.3 |
| Auth (identity) | Firebase Authentication | via firebase 10.1.0 |
| Database | Firebase Firestore | via firebase-admin 11.10.1 |
| Storage | Firebase Storage | via firebase 10.1.0 |
| Forms | react-hook-form | 7.45.2 |
| Notifications (UI) | react-hot-toast | 2.4.1 |
| Animation | framer-motion | 10.16.4 |
| Icons | lucide-react | 0.279.0 |
| UI utilities | clsx, tailwind-merge, class-variance-authority | various |
| HTTP client | axios | 1.10.0 |
| Deployment | Vercel | via vercel CLI |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` |

**Notable missing dependency:** `zod` is imported in `src/lib/utils/validation.ts` but is not listed in `package.json`.

---

## Applications / Components

Single Next.js application. No monorepo. No separate services.

---

## Directory Structure

```
/src
  /app                    Next.js App Router pages and API routes
    /api                  Server-side API routes
      /admin              Admin-specific routes
      /admin-sdk          Primary data API routes (children, users, alerts)
      /alerts             Duplicate alert routes
      /auth               NextAuth handler + auth utilities
      /children           Duplicate children routes
      /debug              Debug/diagnostic routes (no auth on most)
      /parent             Parent-specific routes
      /users              User management routes
    /auth                 Authentication pages (login, register, forgot-password, error, logout)
    /dashboard            Role-based dashboard pages
      /admin              Admin dashboard + sub-pages (users, alerts, activities, reports, settings, profile)
      /authority          Authority dashboard + sub-pages (alerts, cases, reports, search, settings, profile)
      /community          Community dashboard + sub-pages (profile)
      /parent             Parent dashboard + sub-pages (children, alerts, report, resources, settings, profile)
      /school             School dashboard + sub-pages (students, alerts, settings, profile)
    /test-auth            Test authentication page
  /components             Reusable React components
    /alerts               Alert badge components (StatusBadge, AlertTypeBadge)
    /auth                 Auth forms (LoginForm, RegisterForm, ForgotPasswordForm)
    /dashboard            Dashboard overview components
    /emergency            MissingChildForm
    /forms                ChildProfileForm
    /home                 Public home page sections (Hero, Features, CTA)
    /layout               Layout components (Header, Footer, DashboardLayout, DashboardHeader)
    /parent               ChildrenList
    /profile              UserProfile, UserProfilePhoto
    /ui                   UI component library (Button, Card, Input, etc.)
    NotificationBell.tsx
    RoleSwitcher.tsx
  /hooks                  Custom React hooks
  /lib                    Utilities and service clients
    /firebase             Firebase client and admin SDK
    /utils                Utility functions
    auth.ts               NextAuth configuration
    constants.ts          Application constants
    utils.ts              General utilities
  /scripts                In-source scripts
  /styles                 CSS and theme files
  /types                  TypeScript type definitions
  middleware.ts           Route protection middleware

/playbook                 Strategic documents (9 files)
/docs-archive             Archived documentation (23 files)
/reference                Legacy routes and conflicting rules
/scripts                  Firebase admin scripts (18 files)
/public                   Static assets including test HTML/JS files
```

---

## Routes

### Public Routes
| Route | Description |
|---|---|
| `/` | Home page (Hero, Features, CTA) |
| `/auth/login` | Login page with role selector |
| `/auth/register` | Registration page |
| `/auth/forgot-password` | Password reset request |
| `/auth/error` | Auth error page |
| `/auth/logout` | Logout page |

### Protected Dashboard Routes
| Route | Role | Status |
|---|---|---|
| `/dashboard` | All (redirects to role dashboard) | Functional |
| `/dashboard/parent` | parent | Functional |
| `/dashboard/parent/profile` | parent | Functional (children list here) |
| `/dashboard/parent/children/add` | parent | Functional |
| `/dashboard/parent/children/edit/[id]` | parent | Present |
| `/dashboard/parent/children/view/[id]` | parent | Present |
| `/dashboard/parent/report` | parent | Functional |
| `/dashboard/parent/report/confirmation` | parent | Present |
| `/dashboard/parent/alerts` | parent | Present |
| `/dashboard/parent/alerts/[id]` | parent | Present |
| `/dashboard/parent/resources` | parent | Present |
| `/dashboard/parent/settings` | parent | Present |
| `/dashboard/school` | school | Placeholder |
| `/dashboard/school/students` | school | Functional (uses debug API) |
| `/dashboard/school/alerts` | school | Present |
| `/dashboard/school/alerts/[id]` | school | Present |
| `/dashboard/school/profile` | school | Present |
| `/dashboard/school/settings` | school | Present |
| `/dashboard/authority` | authority | Placeholder |
| `/dashboard/authority/alerts` | authority | Functional (uses debug API) |
| `/dashboard/authority/alerts/[id]` | authority | Present |
| `/dashboard/authority/cases` | authority | Present |
| `/dashboard/authority/reports` | authority | Present |
| `/dashboard/authority/search` | authority | Present |
| `/dashboard/authority/settings` | authority | Present |
| `/dashboard/community` | community | Placeholder |
| `/dashboard/community/profile` | community | Present |
| `/dashboard/admin` | admin | Functional |
| `/dashboard/admin/users` | admin | Functional |
| `/dashboard/admin/users/[id]` | admin | Present |
| `/dashboard/admin/users/create` | admin | Present |
| `/dashboard/admin/alerts` | admin | Functional (uses debug API) |
| `/dashboard/admin/alerts/[id]` | admin | Present |
| `/dashboard/admin/alerts/create` | admin | Present |
| `/dashboard/admin/activities` | admin | Present |
| `/dashboard/admin/reports` | admin | Present |
| `/dashboard/admin/settings` | admin | Present |
| `/dashboard/admin/profile` | admin | Present |

### API Routes
| Route | Methods | Auth required |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | No (NextAuth handler) |
| `/api/auth/create-firebase-user` | POST | No explicit check |
| `/api/auth/logout` | POST | Session |
| `/api/auth/migrate-user` | POST | Session |
| `/api/auth/reset-password` | POST | No |
| `/api/auth/token` | GET | Session |
| `/api/admin-sdk/children` | GET, POST, PUT, DELETE | Session + role |
| `/api/admin-sdk/users` | GET, POST, PUT, DELETE | Session + role |
| `/api/admin-sdk/alerts` | GET, POST | Session |
| `/api/admin-sdk/check` | GET | None |
| `/api/alerts` | GET, POST | Session |
| `/api/alerts/[id]` | GET, PUT, DELETE | Session |
| `/api/children` | GET, POST | Session |
| `/api/children/[id]` | GET, PUT, DELETE | Session |
| `/api/users` | GET, POST | Session |
| `/api/users/[id]` | GET, PUT, DELETE | Session |
| `/api/users/profile` | GET, PUT | Session |
| `/api/parent/alerts` | POST | None (no session check) |
| `/api/parent/create-child` | POST | None (no session check) |
| `/api/admin/alerts` | POST | Session |
| `/api/admin/create-user` | POST | Session |
| `/api/debug/users` | GET, PUT | None |
| `/api/debug/alerts` | GET | None |
| `/api/debug/children` | GET, POST, PUT, DELETE | None |
| `/api/debug/env` | GET | None |
| `/api/debug/session` | GET | None |
| `/api/debug/login` | POST | None |
| `/api/debug/check-credentials` | POST | Admin session |
| `/api/debug/activities` | GET | None |
| `/api/debug/image/[filename]` | GET | None |
| `/api/debug/upload` | POST | None |
| `/api/debug/test` | GET | None |
| `/api/debug/user-check` | GET | None |

---

## Data Stores

### Firebase Firestore Collections (evidenced by rules and API routes)
- `users`
- `children`
- `alerts`
- `notifications`
- `activities`
- `schools`
- `authorities`
- `cases`
- `reports`
- `audit_logs`
- `resources`
- `settings`

### Firebase Storage Buckets (evidenced by storage rules)
- `childPhotos/{userId}/{childId}/` — child photographs
- `child-photos/` — alternative flat structure
- `users/{userId}/` — user profile photos
- `profile-photos/` — alternative flat structure
- `alerts/{alertId}/` — alert attachments
- `alert-attachments/` — alternative flat structure
- `reports/{reportId}/` — report documents
- `schools/{schoolId}/` — school documents
- `authorities/{authorityId}/` — authority documents
- `system/` — system files

---

## Authentication

- **Session management:** NextAuth.js with JWT strategy (24-hour expiry)
- **Identity providers:** Firebase Authentication (email/password), Google OAuth (conditional on env vars)
- **Server-side auth:** Firebase Admin SDK
- **Session reading:** `getServerSession(authOptions)` in API routes, `getToken()` in middleware
- **Role storage:** JWT token field `role`, also `roles[]` array

---

## Environment Variables

From `.env.example`:
```
FIREBASE_SERVICE_ACCOUNT_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID
FIREBASE_SERVICE_ACCOUNT_CLIENT_ID
FIREBASE_SERVICE_ACCOUNT_AUTH_URI
FIREBASE_SERVICE_ACCOUNT_TOKEN_URI
FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL
FIREBASE_SERVICE_ACCOUNT_CLIENT_CERT_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXTAUTH_URL
NEXTAUTH_SECRET
```

Optional (not in .env.example but referenced in code):
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_SMS_ENABLED
```

---

## External Services

| Service | Purpose | Evidence |
|---|---|---|
| Firebase Authentication | User identity | `firebase` package, `auth.ts` |
| Firebase Firestore | Primary database | `firebase-admin` package, all API routes |
| Firebase Storage | File/photo storage | `storage.rules`, `useStorage.ts` |
| Google OAuth | Social login | `auth.ts` (conditional) |
| Vercel | Deployment | `vercel.json`, `deploy.yml` |
| GitHub | Source control + CI/CD | `.github/workflows/deploy.yml` |

**No SMS integration found.** `NEXT_PUBLIC_SMS_ENABLED` is referenced in `docs-archive/HOLISTIC_ASSESSMENT.md` as a future feature but no implementation exists.

**No email notification integration found.** No email service SDK or configuration present.

**No WhatsApp integration found.**

**No mapping service found.**

---

## Notable Scripts

### `/scripts/` directory (18 files)
All scripts are Firebase-specific Node.js scripts:
- `create-admin-user.js`, `create-admin-users.js` — create admin accounts
- `create-test-child.js` — create test child records
- `deploy-firestore-rules.js` — deploy Firestore security rules
- `migrate-users-to-firebase-auth.js` — user migration
- `check-firebase-auth-users.js` — diagnostic
- `check-password-storage.js` — diagnostic (checks plaintext password storage)
- `test-admin-sdk.js`, `test-children-collection.js`, `test-debug-apis.js`, `test-user-creation.js` — test scripts
- `fix-admin-sdk.js`, `fix-firebase-admin.js` — fix scripts
- `admin-sdk-solution.js`, `firebase-admin-solution.js`, `direct-user-creation.js` — solution scripts
- `print-firestore-rules.js` — utility
- `cleanup-docs.js` — documentation cleanup

### Root-level scripts
- `check-port.js`, `find-port.js`, `kill-port.js` — port management
- `check-routes.js` — route checking
- `start-server.js` — server start
- `test-api.js`, `test-endpoints.js` — API testing
- `verify-env.js` — environment variable verification
- `polyfills.js` — polyfills
- Various `.sh` shell scripts for deployment and cleanup

### `/src/scripts/`
- `seed-resources.js` — seed resources collection
- `update-firestore-schema.js` — schema update

---

## Deployment Configuration

- **Platform:** Vercel
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) — deploys on push to `main`/`master`
- **Vercel config:** `vercel.json` has `"git": { "deploymentEnabled": false }` (disables Vercel's own git integration, uses GitHub Actions instead)
- **Firebase config:** `firebase.json` configures Firestore rules and Storage rules deployment

---

## Documentation Discovered

### `/playbook/` (9 files — strategic documents)
- `00-MASTER-PLAYBOOK.md` — product strategy and government pitch
- `01-AGENT-TECHNICAL.md` — Supabase migration plan
- `02-AGENT-GOVERNMENT.md` — government policy alignment
- `03-AGENT-PRESENTATION.md` — presentation structure
- `04-AGENT-IMPACT.md` — statistics and impact model
- `05-AGENT-PILOT.md` — pilot programme design
- `06-AGENT-BUDGET.md` — budget model
- `07-AGENT-LEGAL.md` — legal and compliance
- `08-CORE-PHILOSOPHY.md` — product philosophy
- `09-FULL-CONTEXT-HANDOFF.md` — complete context summary

### `/docs-archive/` (23 files — development diary)
Historical fix logs, implementation summaries, security reports, deployment guides.

### Root-level markdown files (~50 files)
Development diary entries: fix logs, status updates, implementation notes. Not specifications.

### `/public/`
- `test-admin-alert.html`, `test-admin-alert.js` — test pages deployed to production
- `test-alert.html`, `test-alert.js` — test pages deployed to production
- `manifest.json` — PWA manifest
- `sitemap.xml` — sitemap
- `robots.txt` — robots file

---

## Reference Directory

`/reference/` contains:
- `conflicting-rules/` — earlier versions of Firestore and Storage rules that conflicted with current rules
- `legacy-routes/children/` — earlier version of children routes
- `legacy-routes/parent-children/` — earlier parent-children route
- `test-pages/auth-debug/` — auth debug page
- `test-pages/test-children/` — test children page
