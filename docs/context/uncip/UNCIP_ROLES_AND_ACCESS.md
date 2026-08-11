# UNCIP_ROLES_AND_ACCESS.md
## Step 5 — Roles and Access

---

## User Roles

**Evidenced by `src/types/user.ts`:**
```
'parent' | 'school' | 'authority' | 'community' | 'admin'
```

---

## Role Descriptions and Dashboard Status

| Role | Description | Dashboard status |
|---|---|---|
| `parent` | Guardian of registered children | Functional |
| `school` | School staff | Partially implemented |
| `authority` | SAPS, ward councillor, DSD | Partially implemented |
| `community` | Community champion, CPF member | Placeholder only |
| `admin` | Unami Foundation operator | Functional |

---

## Authentication Mechanisms

**Evidenced by `src/lib/auth.ts`:**
- NextAuth.js credentials provider (email + password)
- Google OAuth provider (conditional — only active if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are set)
- JWT session strategy (24-hour expiry)

**Evidenced by `src/hooks/useAuth.ts`:**
- Firebase Auth client SDK also used for sign-in, sign-up, Google sign-in, and password reset
- Two authentication systems run simultaneously (NextAuth + Firebase Auth)

---

## Role Assignment

**Evidenced by `src/lib/auth.ts`:**
1. Role is selected by the user at login (role selector buttons on login page)
2. Role is selected by the user at registration (dropdown)
3. For admin email: role is hardcoded to `admin` regardless of selection
4. For Firestore users: role read from `users.role` field
5. For Firebase Auth users: role read from custom claims `role`
6. For `demo123` users: role is whatever was selected at login

**Role is stored in three places simultaneously:**
- Firestore `users.role` field
- Firebase Auth custom claims `{ role, roles: [] }`
- NextAuth JWT token `{ role, roles: [] }`

These three sources can become inconsistent.

---

## Route Protection

**Evidenced by `src/middleware.ts`:**

Public routes (no auth required):
- `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/error`, `/signin`, `/api/auth/*`, `/test-auth`

All other routes require a valid NextAuth JWT token. If no token: redirect to `/auth/login`.

Role-based routing:
- `/dashboard/[role]` — user is redirected to their own role's dashboard
- Admin can access any dashboard
- Non-admin accessing another role's dashboard is redirected to their own

**Note:** API routes are explicitly excluded from middleware protection (`pathname.startsWith('/api')`). API routes must implement their own authentication checks.

---

## API Route Authentication

**Evidenced by reading API route files:**

| Route | Auth check |
|---|---|
| `/api/admin-sdk/children` | `getServerSession(authOptions)` — 401 if no session |
| `/api/admin-sdk/users` | `getServerSession(authOptions)` — 401 if no session |
| `/api/admin-sdk/alerts` | `getServerSession(authOptions)` — 401 if no session |
| `/api/admin-sdk/check` | None |
| `/api/alerts` | `getServerSession()` (no authOptions) — 401 if no session |
| `/api/alerts/[id]` | `getServerSession()` (no authOptions) |
| `/api/parent/alerts` | None — no session check |
| `/api/parent/create-child` | Unknown |
| `/api/debug/users` | None |
| `/api/debug/alerts` | None |
| `/api/debug/children` | None |
| `/api/debug/env` | None |
| `/api/debug/session` | None |
| `/api/debug/login` | None |
| `/api/debug/check-credentials` | Admin session check |
| `/api/debug/activities` | Unknown |
| `/api/debug/image/[filename]` | Unknown |
| `/api/debug/upload` | Unknown |

**Critical finding:** `/api/parent/alerts` (used by the parent report form) has no session check. Any unauthenticated request can create an alert.

**Critical finding:** All `/api/debug/*` routes except `check-credentials` have no authentication. They expose full read/write access to users, children, and alerts data.

---

## Record-Level Access Control

**Evidenced by `firestore.rules` and `src/app/api/admin-sdk/children/route.ts`:**

### Children
| Role | Read | Create | Update | Delete |
|---|---|---|---|---|
| `admin` | All | Yes | Any | Any |
| `authority` | All | No | No | No |
| `parent` | Own children (parentId or guardians[]) | Yes | Own children | Own children |
| `school` | Children at their school (schoolId match) | No | Children at their school | No |
| `community` | None | No | No | No |

### Alerts
| Role | Read | Create | Update | Delete |
|---|---|---|---|---|
| `admin` | All | Yes | Any | Any |
| `authority` | All | Yes | Any active | No |
| `parent` | All (read) | Yes | Own alerts | Own alerts |
| `school` | All (read) | Yes | No | No |
| `community` | All (read) | No | No | No |

**Note:** All authenticated users can read all alerts. No geographic or jurisdictional scoping.

### Users
| Role | Read | Create | Update | Delete |
|---|---|---|---|---|
| `admin` | All | Yes (via Admin SDK) | Any | Any |
| All others | All (read) | No | Own profile | No |

**Note:** All authenticated users can read all user profiles. This exposes PII of all users to all users.

---

## Admin Role Switching

**Evidenced by `src/components/RoleSwitcher.tsx` and `src/hooks/useAuth.ts`:**

The admin user can switch their active role to view any dashboard. This works by calling `updateSession()` with a new role value, which updates the NextAuth JWT token. The admin is then redirected to the selected role's dashboard.

This feature is used for demonstration purposes.

---

## Storage Access Control

**Evidenced by `storage.rules`:**

Child photos: parent (own children), school, authority, admin can read. Parent and admin can write.

User profile photos: all authenticated users can read. Owner and admin can write.

Alert attachments: all authenticated users can read and write.

Catch-all: all authenticated users can read any unmatched path. Admin can write.

---

## Multi-Role Support

**Evidenced by `src/types/user.ts`:**
The `UserProfile` type includes both `role: UserRole` (primary) and `roles?: UserRole[]` (array). The JWT token also carries both. This was added to support the admin role-switching feature. No evidence of real users having multiple roles.
