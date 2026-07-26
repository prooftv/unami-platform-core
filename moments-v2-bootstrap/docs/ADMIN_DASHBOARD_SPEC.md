# Admin Dashboard — Feature Specification

## Tech Stack
- Next.js 14 App Router
- shadcn/ui (New York style, Zinc color)
- TanStack Table v8 for data tables
- Recharts for charts (via shadcn chart component)
- React Hook Form + Zod for forms
- SWR for data fetching

## Starter Template
```bash
cd apps/admin
npx shadcn@latest init
# Style: New York, Color: Zinc, CSS variables: yes

# Add these blocks upfront (saves weeks of UI work):
npx shadcn@latest add sidebar-07      # Collapsible sidebar with nav
npx shadcn@latest add data-table      # TanStack table preset
npx shadcn@latest add chart           # Recharts wrapper
npx shadcn@latest add form            # React Hook Form integration
npx shadcn@latest add dialog          # Modal dialogs
npx shadcn@latest add sheet           # Slide-over panels
npx shadcn@latest add badge           # Status badges
npx shadcn@latest add card            # Stat cards
npx shadcn@latest add tabs            # Tab navigation
npx shadcn@latest add select          # Dropdowns
npx shadcn@latest add calendar        # Date picker
npx shadcn@latest add popover         # Popover wrapper
npx shadcn@latest add toast           # Notifications
npx shadcn@latest add alert           # Alert banners
npx shadcn@latest add progress        # Progress bars
npx shadcn@latest add avatar          # User avatars
npx shadcn@latest add dropdown-menu   # Action menus
npx shadcn@latest add command         # Command palette
```

---

## Module 1: Auth & Layout

### Login Page (`/login`)
- Email + password form
- Supabase Auth (magic link option)
- Redirect to dashboard on success
- Error states for invalid credentials

### Layout (`/admin/layout.tsx`)
- Collapsible sidebar (shadcn sidebar-07)
- Role-based nav items (hide items user can't access)
- Header: breadcrumb + user menu (name, role badge, logout)
- Mobile responsive (hamburger menu)

### Sidebar Navigation
```
Dashboard          → /admin
Moments            → /admin/moments
  ├── All Moments
  ├── Create Moment
  └── Scheduled
Campaigns          → /admin/campaigns
  ├── All Campaigns
  └── Create Campaign
Sponsors           → /admin/sponsors
Moderation         → /admin/moderation
  ├── Message Queue
  └── Audit Trail
Subscribers        → /admin/subscribers
Broadcasts         → /admin/broadcasts
Authority          → /admin/authority  [content_admin+]
Settings           → /admin/settings   [superadmin]
  ├── System Settings
  ├── Admin Users
  ├── Budget Controls
  └── RBAC
```

---

## Module 2: Dashboard Overview (`/admin`)

### Stat Cards (top row)
- Total Moments (with % change vs last 30 days)
- Active Subscribers (with trend)
- Broadcasts Today (success rate badge)
- Budget Used (progress bar, warning if >80%)

### Charts
- Line chart: Broadcasts over last 30 days (daily)
- Bar chart: Moments by region (top 5)
- Donut chart: Content source breakdown (admin/community/campaign)

### Recent Activity Table
- Last 10 moments with: title, region, category, status badge, created time
- Quick actions: View, Broadcast, Edit

### System Status
- Intent queue health (pending count)
- WhatsApp API status
- Last broadcast timestamp

---

## Module 3: Moments Management (`/admin/moments`)

### List View
DataTable columns:
- Title (truncated, click to expand)
- Region (badge)
- Category (badge)
- Status (colored badge: draft/scheduled/broadcasted/cancelled)
- Sponsor (if sponsored)
- Urgency (icon: low/medium/high/urgent)
- Created (relative time)
- Actions (dropdown: Edit, Broadcast, Schedule, Delete)

Filters (top bar):
- Status filter (multi-select)
- Region filter
- Category filter
- Date range picker
- Search by title/content

Bulk actions:
- Select multiple → Broadcast selected
- Select multiple → Delete selected

### Create/Edit Moment (Sheet panel, not separate page)
Form fields:
- Title (required, max 200 chars, char counter)
- Content (required, rich textarea, max 2000 chars, char counter)
- Region (required, select: all SA provinces + National)
- Category (required, select)
- Language (select: English/isiZulu/isiXhosa/Afrikaans)
- Urgency Level (select: low/medium/high/urgent)
- Sponsor (optional, searchable select from sponsors list)
- Is Sponsored (checkbox, auto-checked when sponsor selected)
- PWA Link (optional URL)
- Media URLs (multi-input, drag-drop upload)
- Scheduled At (date-time picker, optional)
- Publish to PWA (toggle, default: on)
- Publish to WhatsApp (toggle, default: off)

Compliance check:
- Real-time compliance check as user types
- Show warnings for prohibited terms
- Risk score indicator

Actions:
- Save as Draft
- Save & Schedule (if scheduled_at set)
- Save & Broadcast (immediately queues for WhatsApp)

### Moment Detail View (expandable row or modal)
- Full content display
- Broadcast history for this moment
- Intent status (pwa/whatsapp)
- MCP advisory if any

---

## Module 4: Campaigns (`/admin/campaigns`)

### List View
DataTable columns:
- Title
- Sponsor
- Budget (formatted currency ZAR)
- Target Regions (badges)
- Status (pipeline badge)
- Created
- Actions

Status pipeline visualization:
```
pending_review → approved → active → published
                          ↓
                        paused
                          ↓
                       cancelled
```

### Create Campaign (Sheet)
Form fields:
- Title (required)
- Content (required, rich textarea)
- Category (required)
- Sponsor (required for sponsored campaigns)
- Budget (ZAR, number input)
- Target Regions (multi-select checkboxes)
- Target Categories (multi-select)
- Media URLs (upload)
- Scheduled At (optional)

### Campaign Detail Page (`/admin/campaigns/:id`)
- Full campaign info
- Budget tracker (spent vs allocated)
- Linked moment (if published)
- A/B test variants (if any)
- Broadcast history
- Actions: Approve, Publish, Pause, Cancel

### A/B Testing Panel
- Create variants (up to 3)
- Set subscriber percentage per variant
- View performance comparison
- Declare winner

---

## Module 5: Sponsors (`/admin/sponsors`)

### List View
Card grid layout (not table):
- Sponsor logo/avatar
- Display name
- Tier badge (bronze/silver/gold/platinum) with color coding
- Active campaigns count
- Total spend this month
- Actions: Edit, View Campaigns, Deactivate

### Create/Edit Sponsor (Dialog)
Form fields:
- Name (slug, unique)
- Display Name
- Contact Email
- Logo URL (with preview)
- Website URL
- Tier (select)
- Monthly Budget (ZAR)
- Active (toggle)

### Sponsor Detail (`/admin/sponsors/:id`)
- Sponsor profile
- All campaigns by this sponsor
- Budget utilization chart
- ROI metrics (reach per ZAR spent)

---

## Module 6: Content Moderation (`/admin/moderation`)

### Message Queue
DataTable with:
- From number (masked: +27...1234)
- Content preview (truncated)
- MCP confidence score (color-coded progress bar)
  - Green: 0-0.3 (safe)
  - Yellow: 0.3-0.7 (review)
  - Red: 0.7-1.0 (high risk)
- Harm signals (icon badges)
- Spam indicators (icon badges)
- Status (pending/approved/flagged/rejected)
- Time received
- Actions: Approve, Flag, Reject, View Full

Filters:
- All / Pending / Flagged / High Risk / Escalated / Auto-approved

### Message Detail (Sheet)
- Full message content
- From number
- MCP analysis breakdown:
  - Overall confidence score
  - Harm signals detail
  - Spam indicators detail
  - Urgency level
  - Escalation recommendation
- Authority context (if user has authority profile)
- Actions: Approve → Create Moment, Flag, Reject

### Audit Trail (`/admin/moderation/audit`)
- All moderation actions with: action, moderator, timestamp, reason
- Filter by action type, moderator, date range

---

## Module 7: Subscribers (`/admin/subscribers`)

### List View
DataTable:
- Phone (masked)
- Status (opted-in/out badge)
- Regions (badges, max 3 shown)
- Categories (count)
- Language
- Delivery Schedule
- Last Activity (relative time)
- Joined (relative time)

Filters: Active / Inactive / All
Search: by phone number

Stats bar (above table):
- Total: 3,420
- Active: 2,891 (84.5%)
- Opted Out: 529
- Active Last 30 Days: 1,205

### Export
- Export to CSV (server-side, not client-side)
- Filter before export

---

## Module 8: Broadcasts (`/admin/broadcasts`)

### List View
DataTable:
- Moment title
- Region
- Recipients
- Success / Failure counts
- Success rate (progress bar)
- Status badge
- Started At
- Duration

### Broadcast Detail
- Full broadcast info
- Batch breakdown (if batched)
- Failed recipients (count, not numbers for privacy)
- Retry failed button

### Intent Queue
- Pending intents (real-time count)
- Processing intents
- Failed intents with error details
- Retry button for failed intents

---

## Module 9: Authority Management (`/admin/authority`)

### List View
DataTable:
- User identifier (phone, masked)
- Role label
- Authority level (1-5 with visual indicator)
- Scope + scope identifier
- Approval mode badge
- Blast radius
- Status (active/suspended/expired)
- Valid Until
- Actions: Edit, Suspend, View Audit

### Create/Edit Authority Profile (Sheet)
Form fields:
- User Identifier (phone number)
- Authority Level (1-5 slider)
- Role Label (text)
- Scope (select: community/region/province/national)
- Scope Identifier (conditional: province code if scope=province)
- Approval Mode (select: admin_review/ai_review/auto)
- Blast Radius (number, max 10000)
- Risk Threshold (0.1-0.9 slider)
- Valid Until (date picker, optional)

### Audit Log
- All authority actions: created/updated/suspended/enforced
- Actor, timestamp, context

---

## Module 10: Settings (`/admin/settings`)

### System Settings
Key-value editor for:
- monthly_budget
- warning_threshold
- message_cost
- daily_limit
- broadcast_batch_size
- auto_approve_threshold

### Budget Controls
- Monthly budget overview
- Per-sponsor budget allocation
- Transaction history
- Alert configuration

### Admin Users (`/admin/settings/users`)
Requires: superadmin
- List all admin users
- Create new admin user
- Assign/change roles
- Deactivate users

### RBAC
- Role definitions and permissions matrix
- Current role assignments

---

## Global UI Patterns

### Status Badges
```
draft       → gray badge
scheduled   → blue badge
broadcasted → green badge
cancelled   → red badge
pending     → yellow badge
approved    → green badge
flagged     → orange badge
rejected    → red badge
```

### Loading States
- Skeleton loaders for tables (not spinners)
- Optimistic updates for quick actions (approve/flag)

### Empty States
- Illustrated empty states with CTA
- "No moments yet — Create your first moment"

### Error Handling
- Toast notifications for API errors
- Inline form validation errors
- Retry buttons for failed operations

### Keyboard Shortcuts
- `Cmd+K` — Command palette (search moments, navigate)
- `Cmd+N` — New moment
- `Esc` — Close sheet/dialog

### Dark Mode
- System preference detection
- Manual toggle in header
- Persisted in localStorage
