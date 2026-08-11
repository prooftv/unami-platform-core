# UNCIP_KNOWN_GAPS.md
## Step 11 — Known Gaps and Technical Debt

---

## Broken Functionality

| Item | Evidence |
|---|---|
| Photo upload | `APP_CONTEXT.md`: "Currently broken due to Firebase Storage conflicts" |
| Firebase backend | `playbook/00-MASTER-PLAYBOOK.md`: "Firebase backend (billing/subscription issues)" listed under "What Doesn't Work" |
| `zod` validation | `zod` imported in `validation.ts` but not in `package.json` — runtime crash |

---

## Incomplete Functionality

| Item | Evidence |
|---|---|
| School dashboard | Placeholder page. Students page shows all children with no school filter. No attendance tracking. |
| Authority dashboard | Placeholder page. Alerts page works but uses unauthenticated debug API. No jurisdiction filtering. No case management. |
| Community dashboard | Placeholder page. No functionality at all. |
| Alert notifications | No email, SMS, or push notifications sent when alert is created or resolved |
| Alert timeline | No multi-stakeholder response tracking. No record of who did what on an alert. |
| SAPS case number | Field exists in type definition but never populated |
| School confirms last seen | Workflow described in playbook but not implemented |
| Community sighting reports | Workflow described in playbook but not implemented |
| Consent capture | No parental consent mechanism at child registration |
| Terms of service / Privacy policy | Links exist in registration form but routes do not exist |
| Password reset | Form exists but implementation status unknown (uses Firebase Auth `sendPasswordResetEmail`) |
| Cascade deletion | Deleting a child does not delete associated alerts, notifications, or activities |
| Data retention | No retention policy or expiry mechanism |
| Offline capability | No service worker, no PWA offline support |
| Geographic scoping | No jurisdiction or province-based filtering for alerts |

---

## Inconsistent Architecture

| Item | Evidence |
|---|---|
| Two authentication systems | Firebase Auth + NextAuth running simultaneously |
| Firebase Admin SDK in multiple places | `admin.ts`, `admin-singleton.ts`, inline in `admin-sdk/alerts/route.ts` and `admin-sdk/users/route.ts` |
| Three duplicate children hooks | `useChildren`, `useChildProfiles`, `useAdminSdk` |
| Three duplicate children API routes | `/api/admin-sdk/children`, `/api/children`, `/api/debug/children` |
| Duplicate alert API routes | `/api/admin-sdk/alerts`, `/api/alerts`, `/api/parent/alerts` |
| Role stored in three places | Firestore `users.role`, Firebase Auth custom claims, NextAuth JWT |
| Alert type in two fields | `alertType` and `type` on same record |
| Alert location in two schemas | Nested `lastSeen` object and flat fields on same record |
| Parent-child relationship in two models | `parentId` and `guardians[]` on same record |

---

## Duplicated Functionality

| Item | Evidence |
|---|---|
| `useChildren` vs `useChildProfiles` vs `useAdminSdk` | Three hooks for the same data |
| `/api/admin-sdk/children` vs `/api/children` vs `/api/debug/children` | Three routes for the same data |
| `admin.ts` vs `admin-singleton.ts` vs inline init | Three Firebase Admin SDK initialisations |

---

## Dead Code

| Item | Evidence |
|---|---|
| `src/hooks/useTestAuth.ts` | Hardcoded test credentials — should not exist |
| `src/app/test-auth/page.tsx` | Test page |
| `reference/` directory | Legacy routes and conflicting rules |
| `*.bak` files | `route.ts.bak` files committed to repository |
| `node` file at root | Unknown binary/symlink |

---

## Security Concerns (Summary)

Full detail in `UNCIP_PRIVACY_AND_SAFEGUARDING.md`.

| Concern | Severity |
|---|---|
| Hardcoded admin credentials in source | Critical |
| Universal `demo123` backdoor password | Critical |
| Plaintext password storage in Firestore | Critical |
| Unauthenticated debug API routes in production | Critical |
| Production dashboards use unauthenticated debug APIs | Critical |
| Alert creation endpoint has no auth check | High |
| All users can read all user profiles | Medium |
| Console logging of password comparisons | Medium |

---

## Data Model Problems

| Problem | Evidence |
|---|---|
| Dual parent-child relationship model | `childrenApi.ts` queries both `parentId` and `guardians[]` |
| Dual alert type field | `alertUtils.ts` normalises `alertType` and `type` |
| Dual alert location schema | `alertUtils.ts` normalises nested and flat structures |
| Denormalised child data on alerts | `childName`, `childAge`, `childPhoto` on alert records |
| School relationship inconsistency | `schoolId` and `schoolName` used interchangeably |
| No cascade deletion | Evidenced by absence of any cascade logic |

---

## Dependency Problems

| Problem | Evidence |
|---|---|
| `zod` not in `package.json` | Import in `validation.ts`, missing from `package.json` |
| Firebase billing issues | `playbook/00-MASTER-PLAYBOOK.md` |
| `next.config.js` uses `experimental.appDir` | This was experimental in Next.js 13, now stable — config is outdated |

---

## Deployment Problems

| Problem | Evidence |
|---|---|
| `vercel.json` disables Vercel git integration | `"git": { "deploymentEnabled": false }` — relies entirely on GitHub Actions |
| Hardcoded Codespaces URL in constants | `src/lib/constants.ts` BASE_URL fallback |
| Test HTML files deployed to production | `public/test-admin-alert.html`, `public/test-alert.html` |

---

## Missing Tests

No test files found anywhere in the repository. No test framework configured. No test scripts in `package.json`.

---

## Missing Documentation

| Missing | Notes |
|---|---|
| Terms of service | Linked from registration page, route does not exist |
| Privacy policy | Linked from registration page, route does not exist |
| API documentation | No OpenAPI spec or equivalent |
| Data model documentation | No schema documentation (this extraction pack is the first) |
| Deployment runbook | Scattered across multiple markdown files |

---

## Unresolved Product Questions

| Question | Evidence of uncertainty |
|---|---|
| What is the `community` role supposed to do? | Dashboard is a placeholder with no specification |
| What are `cases` and `reports` collections for? | Collections exist in rules, no UI or specification |
| What is the `resources` collection for? | Seed script exists, no UI or specification |
| Should school users see all children or only enrolled children? | Current implementation shows all children |
| Should authority users see all alerts or only their jurisdiction? | Current implementation shows all alerts |
| What is the intended alert type taxonomy? | Inconsistent between creation form and filter UI |
| Was a physical/digital identification kit intended? | Mentioned in product name but no implementation |
