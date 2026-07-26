# Shared Types — Reference

All TypeScript types to implement in packages/types/src/index.ts

---

## Enums

```typescript
export type Region = 'KZN' | 'WC' | 'GP' | 'EC' | 'FS' | 'LP' | 'MP' | 'NC' | 'NW' | 'National'

export type Category =
  | 'Education' | 'Safety' | 'Culture' | 'Opportunity'
  | 'Events' | 'Health' | 'Technology' | 'Community'

export type MomentStatus = 'draft' | 'scheduled' | 'broadcasted' | 'cancelled'

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent'

export type ContentSource = 'admin' | 'community' | 'whatsapp' | 'campaign'

export type Language = 'eng' | 'zul' | 'xho' | 'afr'

export type SponsorTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type CampaignStatus =
  | 'pending_review' | 'approved' | 'active'
  | 'paused' | 'completed' | 'cancelled' | 'published'

export type IntentChannel = 'pwa' | 'whatsapp' | 'email' | 'sms'

export type IntentStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'

export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected'

export type AdminRole = 'superadmin' | 'content_admin' | 'moderator' | 'viewer'

export type AuthorityScope = 'community' | 'region' | 'province' | 'national'

export type ApprovalMode = 'admin_review' | 'ai_review' | 'auto'

export type DeliverySchedule = 'instant' | 'morning' | 'evening' | 'weekly'
```

---

## Core Models

```typescript
export interface Moment {
  id: string
  title: string
  content: string
  raw_content?: string | null
  region: Region
  category: Category
  language: Language
  sponsor_id?: string | null
  sponsor?: Pick<Sponsor, 'id' | 'display_name' | 'logo_url'> | null
  is_sponsored: boolean
  pwa_link?: string | null
  media_urls: string[]
  scheduled_at?: string | null
  broadcasted_at?: string | null
  status: MomentStatus
  urgency_level: UrgencyLevel
  content_source: ContentSource
  created_by?: string | null
  publish_to_whatsapp: boolean
  publish_to_pwa: boolean
  digest_sent?: string | null
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  name: string
  display_name: string
  contact_email?: string | null
  logo_url?: string | null
  website_url?: string | null
  tier: SponsorTier
  monthly_budget: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  title: string
  content: string
  category: Category
  sponsor_id?: string | null
  sponsor?: Pick<Sponsor, 'id' | 'display_name'> | null
  budget: number
  target_regions: Region[]
  target_categories: Category[]
  media_urls: string[]
  scheduled_at?: string | null
  status: CampaignStatus
  template_name?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  phone_number: string
  opted_in: boolean
  regions: Region[]
  categories: Category[]
  language_preference: Language
  delivery_schedule: DeliverySchedule
  paused_until?: string | null
  opted_in_at: string
  opted_out_at?: string | null
  last_activity: string
  consent_timestamp?: string | null
  consent_method?: string | null
  created_at: string
}

export interface Message {
  id: string
  whatsapp_id: string
  from_number: string
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document'
  content?: string | null
  media_url?: string | null
  media_id?: string | null
  language_detected?: string | null
  authority_context?: AuthorityContext | null
  timestamp: string
  processed: boolean
  moderation_status: ModerationStatus
  advisories?: Advisory[]
  created_at: string
  updated_at: string
}

export interface Advisory {
  id: string
  message_id?: string | null
  moment_id?: string | null
  advisory_type: 'language' | 'urgency' | 'harm' | 'spam' | 'content_quality'
  confidence: number
  harm_signals?: {
    confidence: number
    detected: boolean
    type: string
    violence?: boolean
    harassment?: boolean
    threats?: boolean
    hate_speech?: boolean
  } | null
  spam_indicators?: {
    confidence: number
    detected: boolean
    type: string
    promotional?: boolean
    repetitive?: boolean
    links?: boolean
    financial_fraud?: boolean
  } | null
  urgency_level: UrgencyLevel
  escalation_suggested: boolean
  details?: Record<string, unknown> | null
  created_at: string
}

export interface MomentIntent {
  id: string
  moment_id: string
  channel: IntentChannel
  action: 'publish' | 'update' | 'delete'
  status: IntentStatus
  template_id?: string | null
  payload?: {
    title: string
    full_text?: string
    summary?: string
    link: string
    region?: Region
    recipient_count?: number
  } | null
  attempts: number
  last_attempt_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface Broadcast {
  id: string
  moment_id: string
  moment?: Pick<Moment, 'title' | 'region' | 'category'> | null
  campaign_id?: string | null
  recipient_count: number
  success_count: number
  failure_count: number
  broadcast_started_at: string
  broadcast_completed_at?: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  authority_context?: AuthorityContext | null
  created_at: string
}

export interface AuthorityProfile {
  id: string
  user_identifier: string
  authority_level: 1 | 2 | 3 | 4 | 5
  role_label: string
  scope: AuthorityScope
  scope_identifier?: string | null
  approval_mode: ApprovalMode
  blast_radius: number
  risk_threshold: number
  status: 'active' | 'suspended' | 'expired'
  valid_until?: string | null
  metadata?: Record<string, unknown>
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface AuthorityContext {
  has_authority: boolean
  level: number
  role: string
  scope: string
  scope_identifier?: string | null
  approval_mode: ApprovalMode
  blast_radius: number
  risk_threshold: number
  lookup_timestamp?: string
}
```

---

## API Response Types

```typescript
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AnalyticsOverview {
  totalMoments: number
  broadcastedMoments: number
  communityMoments: number
  adminMoments: number
  campaignMoments: number
  totalBroadcasts: number
  successfulBroadcasts: number
  pendingBroadcasts: number
  failedBroadcasts: number
  successRate: string
  totalSubscribers: number
  activeSubscribers: number
  recentActivity: number
  systemStatus: {
    intentSystem: 'healthy' | 'backlog'
    lastUpdated: string
  }
}

export interface ComplianceResult {
  is_compliant: boolean
  risk_score: number
  violation_severity: 'SAFE' | 'WARN' | 'SUSPEND'
  violations: string[]
  requires_approval: boolean
  recommendation: string
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: string
  description?: string | null
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  active: boolean
  role?: AdminRole
  last_login?: string | null
  created_at: string
}

export interface BudgetOverview {
  data: {
    total: number
    used: number
    message_cost: number
    messages_sent: number
    messages_remaining: number
  }
  settings: {
    monthly_budget: number
    warning_threshold: number
    message_cost: number
    daily_limit: number
  }
  alerts: Array<{
    level: 'warning' | 'critical'
    message: string
  }>
}
```

---

## Form Input Types (for React Hook Form)

```typescript
export interface CreateMomentInput {
  title: string
  content: string
  region: Region
  category: Category
  language: Language
  sponsor_id?: string | null
  is_sponsored: boolean
  pwa_link?: string | null
  media_urls: string[]
  scheduled_at?: string | null
  urgency_level: UrgencyLevel
  publish_to_pwa: boolean
  publish_to_whatsapp: boolean
}

export interface CreateCampaignInput {
  title: string
  content: string
  category: Category
  sponsor_id?: string | null
  budget: number
  target_regions: Region[]
  target_categories: Category[]
  media_urls: string[]
  scheduled_at?: string | null
}

export interface CreateSponsorInput {
  name: string
  display_name: string
  contact_email?: string | null
  logo_url?: string | null
  website_url?: string | null
  tier: SponsorTier
  monthly_budget: number
}

export interface CreateAuthorityInput {
  user_identifier: string
  authority_level: 1 | 2 | 3 | 4 | 5
  role_label: string
  scope: AuthorityScope
  scope_identifier?: string | null
  approval_mode: ApprovalMode
  blast_radius: number
  risk_threshold: number
  valid_until?: string | null
}
```
