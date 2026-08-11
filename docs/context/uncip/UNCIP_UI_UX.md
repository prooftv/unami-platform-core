# UNCIP_UI_UX.md
## Step 7 — UI/UX Extraction

---

## Public Experience

**Route:** `/`

**Evidenced by implementation:** Three-section public home page:
1. `HeroSection` — headline, subheadline, call-to-action buttons (Get Started, Learn More)
2. `FeaturesSection` — feature cards describing the platform
3. `CTASection` — call to action

**What the UI reveals about product intent:** The public page positions UNCIP as a community safety platform. The hero section and features section are the primary marketing surface.

**Navigation:** `Header` component with logo and navigation links. `Footer` component.

---

## Authentication Experience

### Login Page (`/auth/login`)

**Evidenced by implementation:**
- Email and password fields
- Role selector buttons (Admin, Parent, School, Authority) — visual toggle, not a form field
- Hidden role field passed to NextAuth
- "Remember me" checkbox (no implementation found for this)
- Forgot password link
- Register link
- Login instructions panel showing `demo123` as the universal password
- Text: "New Users: any-email@example.com / demo123"
- Text: "Registered Users: Use your email with password 'demo123'"

**What the UI reveals:** The login page publicly documents the `demo123` backdoor. This is visible to any visitor.

### Registration Page (`/auth/register`)

**Evidenced by implementation:**
- Full name, email, password, confirm password fields
- Role dropdown: Parent/Guardian, School/Teacher, Authority/NGO, Community Leader
- Note: `admin` role is not available in the registration dropdown
- Links to `/terms` and `/privacy-policy` (routes do not exist)

### Forgot Password Page (`/auth/forgot-password`)

**Evidenced by implementation:** Password reset request form. Uses Firebase Auth `sendPasswordResetEmail`.

---

## Parent Dashboard Experience

**Route:** `/dashboard/parent`

**Evidenced by implementation:**
- Dashboard overview with stats (total children, active alerts, recent activity)
- Quick actions panel
- Recent activity list

**Route:** `/dashboard/parent/profile`

**Evidenced by implementation:**
- User profile section (name, email, photo, phone, address)
- Children management section with "Add Child" button
- `ChildrenList` component showing registered children with photos, names, ages

**Route:** `/dashboard/parent/children/add`

**Evidenced by implementation:** `ChildProfileForm` — multi-section form:
- Personal information (name, DOB, gender, ID number)
- School information (school name)
- Address (street, city, province, postal code)
- Medical information (blood type, allergies, conditions, medications)
- Emergency contact (name, relationship, phone)
- Photo upload

**Route:** `/dashboard/parent/report`

**Evidenced by implementation:** Missing child report form:
- Child selector dropdown (populated from `/api/debug/children`)
- Alert type selector (missing, medical, danger, other)
- Description textarea
- Date and time last seen
- Last seen location
- Last seen wearing
- Contact information
- Submit button: "Report Missing Child" (red)

**Route:** `/dashboard/parent/alerts`

**Evidenced by implementation:** List of alerts created by the parent.

---

## School Dashboard Experience

**Route:** `/dashboard/school`

**Evidenced by implementation:** Placeholder page showing:
- Welcome message with logged-in user name and role
- Active alerts panel (via `ActiveAlertsDashboard` component)
- Empty "Students" panel with link to `/dashboard/school/students`
- Empty "Attendance" panel
- Link to `/auth-debug` (debug page — this link should not be in production)

**Route:** `/dashboard/school/students`

**Evidenced by implementation:** Table of all children (fetched from `/api/debug/children` — no school filtering). Columns: student name/photo, age, gender, school name. "View Details" button present but no action implemented.

**Route:** `/dashboard/school/alerts`

**Evidenced by implementation:** Alert list (similar to authority alerts page).

---

## Authority Dashboard Experience

**Route:** `/dashboard/authority`

**Evidenced by implementation:** Placeholder page showing:
- Welcome message
- Jurisdiction explanation text
- Empty "Alerts" panel with link to `/dashboard/authority/alerts`
- Empty "Statistics" panel

**Route:** `/dashboard/authority/alerts`

**Evidenced by implementation:** Functional alert list:
- Status filter buttons (All, Active, Resolved)
- Type filter buttons (All, Missing, Emergency, Medical, School)
- Search form (client-side filtering only)
- Alert list with child photo, name, status badge, type badge, last seen location
- "View Details" link per alert
- Pagination

Data fetched from `/api/debug/alerts` and `/api/debug/children` (unauthenticated).

---

## Admin Dashboard Experience

**Route:** `/dashboard/admin`

**Evidenced by implementation:** Dashboard overview with system stats.

**Route:** `/dashboard/admin/users`

**Evidenced by implementation:** Full user management:
- User table with photo, name, email, role badge, status badge, created date
- Role filter dropdown
- Pagination
- "Add User" button → `/dashboard/admin/users/create`
- "View Profile" link per user
- "Delete" button per user (with confirmation dialog)

**Route:** `/dashboard/admin/alerts`

**Evidenced by implementation:** Alert management (same pattern as authority alerts, plus "Create Alert" button).

---

## Community Dashboard Experience

**Route:** `/dashboard/community`

**Evidenced by implementation:** Placeholder page showing:
- Welcome message with logged-in user name and role
- Empty "Resources" panel
- Empty "Events" panel
- Link to `/auth-debug` (debug page)

---

## UI Component Library

**Evidenced by `src/components/ui/`:**
- `Button` — variants: primary, secondary, outline, danger; sizes; loading state
- `Card`, `DashboardCard` — card containers
- `Input` — with label, error, left icon, password toggle
- `Alert` — info/warning/error/success variants
- `LoadingSpinner` — size and color variants
- `EmptyState` — empty state with icon and message
- `DataTable` — table component
- `Pagination` — page navigation
- `PhotoUpload` — file upload with preview
- `ConfirmDialog` — confirmation modal
- `ErrorBoundary` — React error boundary
- `Container`, `ResponsiveContainer` — layout containers
- `Checkbox` — checkbox input
- `Divider` — horizontal divider with optional text

---

## Layout

**Evidenced by `src/components/layout/`:**
- `DashboardLayout` / `EnhancedDashboardLayout` — sidebar + header layout
- `DashboardHeader` — top bar with user info, notification bell, role switcher (admin only)
- `Header` — public page header
- `Footer` — public page footer

Sidebar navigation is role-specific. Each role has its own layout file defining its navigation items.

---

## Mobile Behaviour

**Evidenced by Tailwind CSS responsive classes throughout:** The application uses responsive Tailwind classes (`sm:`, `md:`, `lg:`) indicating mobile-first design intent. No PWA service worker found. No offline capability.

---

## What the UI Reveals About Product Intent

1. The login page's role selector buttons suggest the system was designed to be used by multiple distinct user types with different experiences.

2. The parent report form's red "Report Missing Child" button and emergency warning banner indicate the system treats alert creation as a serious, high-stakes action.

3. The school and authority dashboards being placeholders indicates these were planned but not completed — the product intent is clear but the implementation is incomplete.

4. The presence of a `RoleSwitcher` component for admin indicates the system was designed to be demonstrated by a single admin user switching between roles.

5. The `demo123` instructions on the login page indicate the system was built for demonstration purposes, not production use with real data.
