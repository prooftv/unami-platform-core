# Features — Complete System Inventory

Every feature that exists in the current system, preserved here for the rebuild.

---

## 1. WhatsApp Subscription System

### Opt-In
- User sends START, JOIN, or SUBSCRIBE
- System upserts subscription record with opted_in=true, consent_timestamp, consent_method='whatsapp_optin'
- double_opt_in_confirmed=true stored for POPIA compliance
- Welcome message sent with interactive buttons (Choose Regions, Choose Interests, Help)
- Default regions: National
- Default categories: Education, Safety, Culture, Opportunity, Events, Health, Technology

### Opt-Out
- User sends STOP, UNSUBSCRIBE, QUIT, or CANCEL
- Immediate update: opted_in=false, opted_out_at=now()
- Confirmation sent with single Resubscribe button
- No further messages ever sent (n8n filters opted_in=true only)
- POPIA/GDPR compliant — no delay, no confirmation step required

### Pause
- User sends PAUSE
- Interactive list: 1 Day / 3 Days / 7 Days / 30 Days
- Sets paused_until timestamp on subscription
- n8n skips subscribers where paused_until > now()
- Auto-resumes when paused_until passes

### Delivery Schedule Preferences
- User sends SCHEDULE
- Options: Instant / Morning (8 AM) / Evening (6 PM) / Weekly (Friday)
- Stored as delivery_schedule on subscription
- n8n respects schedule when processing intents

### Region Preferences
- User sends REGIONS or types region codes directly (KZN WC GP)
- Interactive list with all 9 SA provinces
- Stored as regions[] array on subscription
- Broadcasts filtered by region match

### Category/Interest Preferences
- User sends INTERESTS, CATEGORIES, or TOPICS
- Interactive list: EDU/SAF/CUL/OPP/EVE/HEA/TEC/COM or ALL
- Stored as categories[] array on subscription
- Future: filter broadcasts by category match

### Language Preference
- User sends LANGUAGE
- Options: English / isiZulu / isiXhosa
- Stored as language_preference on subscription
- Future: send content in preferred language

### Status Check
- User sends STATUS or SETTINGS
- Shows current: regions, topics, status (active/inactive)
- Interactive buttons to change regions or topics

### Help
- User sends HELP, INFO, MENU, or ?
- Full command reference sent as text message

### Recent Moments
- User sends RECENT
- Returns last 5 broadcasted moments (title + region)
- Link to full PWA feed

### Content Submission
- User sends SUBMIT, SHARE, or MOMENTS
- Shows what content is accepted vs rejected
- Category selector for submission type
- Message stored as draft moment for admin review

### Search
- User sends SEARCH
- Options: By Region / By Topic / Popular
- Returns matching moments (title + region, max 5)
- Link to full PWA

### Report Content
- User sends REPORT
- Options: Spam / Inappropriate / Wrong Info
- Stored in reports table for admin review

### Feedback
- User sends FEEDBACK
- Options: Love it / Suggestion / Issue
- Stored in feedback table

### Reply Threading
- User replies to a broadcast message (message.context.id set)
- System looks up whatsapp_comments by whatsapp_message_id
- Creates comment linked to the moment
- Confirmation sent to user

### Authority Check
- User sends MYAUTHORITY
- If authority profile exists: shows level, role, scope, blast radius
- If not: "No authority profile found"

---

## 2. Content Moderation (MCP System)

### MCP Advisory Function (SQL-based, always runs)
- Runs on every inbound message
- Harm detection: violence, threats, weapons, hate speech (regex patterns)
- Spam detection: scam phrases, financial fraud, short messages, long messages
- Urgency classification: low / medium / high / urgent
- Returns: confidence score (0-1), harm_signals{}, spam_indicators{}, urgency_level
- Stored in advisories table linked to message

### Claude API Enhancement (optional, async)
- If ANTHROPIC_API_KEY set, Claude claude-3-haiku analyzes content
- Prompt: structured JSON response for SA community context
- Falls back to SQL rule-based if Claude fails or key not set
- Result enriches the advisory record

### Auto-Approval Logic
- If MCP confidence < authority threshold (default 0.3): auto-approve
- If user has authority profile: use their risk_threshold instead
- Auto-approved messages: moderation_status='approved', create draft moment
- Auto-approval logged in moderation_audit with reason

### Escalation Logic
- If confidence > 0.7: escalation_suggested=true in advisory
- Admin sees escalated items in moderation queue with red badge
- No automatic blocking — advisory only, human decides

### Admin Moderation Queue
- All messages visible to moderators
- Filter: All / Pending / Flagged / High Risk / Escalated / Auto-approved
- Actions: Approve (creates draft moment) / Flag / Reject
- All actions logged in moderation_audit with moderator ID and reason

### Moderation Principles
- Log everything, block nothing automatically
- Context over keywords — cultural and linguistic awareness
- Human oversight for escalated content
- Advisory-only approach — MCP advises, humans decide

---

## 3. Moments System

### Moment Lifecycle
- draft → scheduled → broadcasted (one-way, no reverting)
- cancelled can be set at any point before broadcasted
- broadcasted moments cannot be edited

### Content Fields
- title: 3-200 chars
- content: 10-2000 chars, formatting preserved (newlines kept)
- region: one of 9 SA provinces or National
- category: Education/Safety/Culture/Opportunity/Events/Health/Technology/Community
- language: eng/zul/xho/afr
- urgency_level: low/medium/high/urgent
- is_sponsored: boolean
- sponsor_id: FK to sponsors
- pwa_link: URL for PWA deep link
- media_urls: array of URLs
- publish_to_pwa: boolean (default true)
- publish_to_whatsapp: boolean (default false, admin must explicitly enable)
- content_source: admin/community/whatsapp/campaign

### Scheduling
- scheduled_at: future timestamp
- Status set to 'scheduled' when scheduled_at provided
- n8n scheduled-broadcasts workflow checks every 5 min
- When scheduled_at <= now(): status → broadcasted, intents created

### Urgency Processing
- urgent moments: processed every 2 minutes
- high moments: processed every 5 minutes
- low/medium: normal scheduled processing

### Weekly Digest
- Non-urgent moments grouped by region
- Sent to subscribers with delivery_schedule='weekly' every Friday 9 AM SAST
- digest_sent timestamp set to prevent re-sending

### Intent-Based Publishing Pipeline
- On broadcast: INSERT moment_intents (channel='whatsapp', status='pending')
- On create with publish_to_pwa=true: INSERT moment_intents (channel='pwa', status='pending')
- Unique constraint: (moment_id, channel) — no duplicates
- n8n intent-executor picks up pending whatsapp intents every 1 minute
- PWA intents: consumed by public API to show in feed

### Community-Submitted Moments
- Inbound WhatsApp messages → draft moments (content_source='whatsapp')
- Admin reviews in moderation queue
- Approve → moment promoted to draft, admin can edit and broadcast
- Community moments labeled differently in broadcast (neutral language, not "official")

---

## 4. Campaign System

### Campaign Lifecycle
- pending_review → approved → active → published
- Can be paused or cancelled at any point
- Only superadmin can approve and publish

### Campaign Fields
- title, content, category
- sponsor_id (required for sponsored campaigns)
- budget: ZAR decimal
- target_regions: array (broadcast filtered to these regions)
- target_categories: array
- media_urls: array
- scheduled_at: optional future date
- template_name: WhatsApp template used for broadcast

### Approval Workflow
1. content_admin creates campaign (status: pending_review)
2. superadmin reviews and approves (status: approved)
3. superadmin publishes → creates Moment + queues broadcast
4. Campaign status → published, moment created with content_source='campaign'

### Budget Management
- Per-campaign budget in ZAR
- message_cost setting (default 0.05 ZAR per message)
- Budget check before broadcast: estimated_cost = recipients × message_cost
- If estimated_cost > remaining_budget: broadcast blocked with error
- budget_transactions table tracks all spend
- Per-sponsor monthly budget allocation
- Warning alerts at configurable threshold (default 80%)
- Daily send limit (default 500 messages/day)

### A/B Testing
- Up to 3 variants per campaign
- Each variant: name, template_name, content_variation, title_variation, subscriber_percentage
- One variant marked as control
- Performance tracked: sends, deliveries, failures, cost
- ab_test_results view for comparison
- Admin declares winner manually

### Template Selection by Authority
- authority_level >= 4: official_announcement_v1
- sponsor_id set: verified_sponsored_v1
- default: community_moment_v1

### Campaign Analytics
- Total campaigns by status
- Budget utilization per campaign
- Reach and success rate
- Top sponsors by campaign count
- Region and category distribution
- ROI: cost per reach

---

## 5. Sponsor Management

### Sponsor Tiers
- bronze (default)
- silver
- gold
- platinum
- Tier affects template selection and display prominence

### Sponsor Fields
- name: unique slug (e.g., "unami-foundation")
- display_name: shown to users (e.g., "Unami Foundation")
- contact_email
- logo_url
- website_url
- tier: bronze/silver/gold/platinum
- monthly_budget: ZAR
- active: boolean

### Sponsor Attribution in Broadcasts
- is_sponsored=true: "In partnership with {display_name}"
- Compliant with Meta marketing policies (no "sponsored" word)
- Uses "partner content" language instead

### Sponsor Assets
- sponsor_assets table: logos, banners per sponsor
- asset_type, asset_url, dimensions, file_size
- Used in PWA display and broadcast formatting

---

## 6. Dynamic Authority System

### Purpose
Allow trusted community members (NGO partners, community leaders, journalists) to have elevated content privileges without being full admins. Fail-open design — errors never block message processing.

### Authority Levels
- Level 1: Community Member (default, no special privileges)
- Level 2: Verified Community Member (lower risk threshold, higher blast radius)
- Level 3: Community Leader (ai_review approval mode, 500 blast radius)
- Level 4: NGO Partner (auto approval possible, 1000 blast radius)
- Level 5: National Authority (national scope, 10000 blast radius)

### Scope Types
- community: local area only
- region: specific region (e.g., Soweto)
- province: specific province (e.g., KZN)
- national: all regions

### Approval Modes
- admin_review: all content goes to admin queue
- ai_review: MCP decides, only high-confidence flags go to admin
- auto: content auto-approved if below risk_threshold

### Blast Radius
- Caps how many subscribers a community member's content reaches
- Default for no authority: 100
- Admin can set up to 10,000
- Applied in broadcast filtering: subscribers.slice(0, blast_radius)

### Risk Threshold
- MCP confidence threshold for auto-approval
- Default: 0.3 (content with confidence < 0.3 auto-approved)
- Authority users can have lower threshold (more permissive)
- Range: 0.1 (very permissive) to 0.9 (very strict)

### Caching
- In-memory cache with 5-minute TTL
- Cache key: "auth:{user_identifier}"
- Cleared on profile update/suspend
- Cleanup job every 10 minutes

### Fail-Open Pattern
- Any error in authority lookup → return null (no authority)
- Processing continues without authority context
- Never blocks message handling

### Audit Trail
- Every authority action logged: created/updated/suspended/enforced
- Actor ID, timestamp, context JSON
- Accessible in admin dashboard

---

## 7. Analytics System

### Dashboard Metrics
- Total moments (all time)
- Broadcasted moments
- Community vs admin vs campaign breakdown
- Active subscribers (opted_in=true)
- Recent activity (active in last 30 days)
- Total broadcasts (intent-based)
- Success rate (sent/total intents)
- Pending/failed intents

### Revenue Analytics
- Total revenue last 30 days
- Total budget allocated across sponsors
- Total spent
- Average cost per broadcast
- ROI percentage
- Profit margin
- Budget utilization percentage

### Campaign Performance
- Per-campaign: reach, cost, success rate
- Top performing campaigns (by conversion rate)
- Template performance comparison

### Dashboard Analytics (time-series)
- Daily stats: moments_count, broadcasts_count, new_subscribers
- Regional stats: moment_count per province
- Category stats: moment_count per category
- Template analytics: usage and performance

### Materialized Views
- unified_analytics: single row with all key metrics
- daily_stats: per-day aggregates
- regional_stats: per-region aggregates
- category_stats: per-category aggregates
- Refreshed via POST /analytics/refresh or scheduled job

---

## 8. Admin RBAC System

### Roles
- superadmin: full access, user management, system settings, approve/publish campaigns
- content_admin: create/edit moments and campaigns, manage sponsors, authority profiles
- moderator: review flagged content, approve/reject messages
- viewer: read-only access to all data

### Role Storage
- admin_roles table: maps Supabase Auth user_id to role
- Checked on every protected API request
- Cached in JWT claims (future optimization)

### Role Enforcement
- API middleware checks role before every handler
- Frontend hides nav items user cannot access
- Superadmin-only: approve campaigns, publish campaigns, manage admin users, system settings

### Admin User Management
- Supabase Auth handles authentication (email/password + magic link)
- admin_roles table maps auth user to role
- Superadmin can create users, assign roles, deactivate

---

## 9. Media System

### Storage
- Supabase Storage bucket: "media" (public)
- Path structure: `moments/{timestamp}_{random}_{filename}` for admin uploads
- Path structure: `whatsapp/{timestamp}_{phone}_{media-id}` for inbound WA media

### Inbound Media Processing
- Receive media message from WhatsApp
- Fetch media URL from Meta API (requires Bearer token)
- Download binary
- Upload to Supabase Storage
- Store metadata in media table (message_id, type, storage_path, file_size, mime_type)
- Update message record with media_url (public URL)

### Admin Media Upload
- Multipart form upload to /upload-media endpoint
- Multiple files in one request
- Returns array of public URLs
- URLs stored in moments.media_urls[]

### Supported Types
- Images: jpg, png, gif, webp
- Videos: mp4, mov
- Audio: mp3, ogg, m4a
- Documents: pdf, docx

---

## 10. Public PWA Features

### Moments Feed
- All broadcasted moments, newest first
- Filter by region (query param)
- Filter by category (query param)
- Filter by source (admin/community/campaign)
- Infinite scroll / pagination
- Sponsor badge on sponsored moments

### Moment Detail
- Full content display
- Media display (images, video player)
- Sponsor attribution
- Share button (WhatsApp deep link)
- Comment thread (approved comments only)
- Related moments (same region/category)

### Stats Display
- Total moments, active subscribers, total broadcasts
- Shown on landing page

### Unsubscribe Page
- /unsubscribe?phone=+27...
- One-click opt-out
- Confirmation message

### Privacy & Terms
- /privacy — privacy policy
- /terms — terms of service
- POPIA compliant data handling disclosure

### PWA Features
- manifest.json for installability
- Service worker for offline support
- Offline page shown when no connection
- App icon and splash screen

---

## 11. System Settings

### Configurable Settings (stored in system_settings table)
- monthly_budget: total monthly budget in ZAR
- warning_threshold: % at which to alert (default 80)
- message_cost: cost per WhatsApp message in ZAR (default 0.05)
- daily_limit: max messages per day (default 500)
- broadcast_batch_size: subscribers per batch (default 50)
- auto_approve_threshold: MCP confidence threshold (default 0.3)

### Feature Flags (feature_flags table)
- comments_enabled: toggle comment system
- authority_system_enabled: toggle authority features
- ab_testing_enabled: toggle A/B test features
- claude_analysis_enabled: toggle Claude API usage

---

## 12. Compliance & Safety

### WhatsApp/Meta Policy Compliance
- No "sponsored" word — use "partner content" or "in partnership with"
- Opt-out instruction in every broadcast ("Reply STOP to unsubscribe")
- Template messages for marketing content (outside 24h window)
- Utility templates for transactional content
- Compliance score tracked per broadcast

### POPIA/GDPR Compliance
- Explicit opt-in required (no pre-checked boxes)
- Immediate opt-out processing (no delay)
- Consent timestamp and method stored
- No individual tracking — aggregate metrics only
- Data minimization — only phone number required

### Content Compliance Check
- Pre-broadcast compliance check via /compliance/check endpoint
- Prohibited terms: vote, election, political party, loan, investment, cryptocurrency, cure, treatment, gambling, bet, lottery
- Risk score calculated
- Violation severity: SAFE / WARN / SUSPEND
- Requires approval if risk_score >= 40

### Audit Trail
- All admin actions logged in audit_logs
- Moderation actions in moderation_audit
- Authority actions in authority_audit_log
- Broadcast compliance in marketing_compliance table
