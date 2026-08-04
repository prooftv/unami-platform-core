export const MomentStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  BROADCASTED: 'broadcasted',
  CANCELLED: 'cancelled',
} as const;
export type MomentStatus = (typeof MomentStatus)[keyof typeof MomentStatus];

export const ContentSource = {
  ADMIN: 'admin',
  COMMUNITY: 'community',
  WHATSAPP: 'whatsapp',
  CAMPAIGN: 'campaign',
} as const;
export type ContentSource = (typeof ContentSource)[keyof typeof ContentSource];

export const UrgencyLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const MomentType = {
  STANDARD: 'standard',
  COMMUNITY: 'community',
  OPPORTUNITY: 'opportunity',
  INFRASTRUCTURE: 'infrastructure',
  CONSULTATION: 'consultation',
} as const;
export type MomentType = (typeof MomentType)[keyof typeof MomentType];

export const MOMENT_TYPE_LABELS: Record<MomentType, string> = {
  standard: 'Standard',
  community: 'Community Notice',
  opportunity: 'Opportunity',
  infrastructure: 'Infrastructure Update',
  consultation: 'Public Consultation',
};

export const MOMENT_TYPE_DESCRIPTIONS: Record<MomentType, string> = {
  standard: 'General community communication',
  community: 'Meeting announcement or community notice',
  opportunity: 'Jobs, bursaries, training, or tenders',
  infrastructure: 'Project status, service delivery, or infrastructure update',
  consultation: 'Public participation — community responses enabled',
};

export const Category = {
  EDUCATION: 'Education',
  SAFETY: 'Safety',
  CULTURE: 'Culture',
  OPPORTUNITY: 'Opportunity',
  EVENTS: 'Events',
  HEALTH: 'Health',
  TECHNOLOGY: 'Technology',
  COMMUNITY: 'Community',
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const Region = {
  KZN: 'KZN',
  WC: 'WC',
  GP: 'GP',
  EC: 'EC',
  FS: 'FS',
  LP: 'LP',
  MP: 'MP',
  NC: 'NC',
  NW: 'NW',
  NATIONAL: 'National',
} as const;
export type Region = (typeof Region)[keyof typeof Region];

export const SponsorTier = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;
export type SponsorTier = (typeof SponsorTier)[keyof typeof SponsorTier];

export const CampaignStatus = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PUBLISHED: 'published',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CampaignType = {
  AD: 'ad',
  ACTIVATION: 'activation',
  CSR: 'csr',
} as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  ad: 'Sponsorship',
  activation: 'Activation',
  csr: 'CSR / Initiative',
};

export const ProjectHealth = {
  GREEN: 'green',
  AMBER: 'amber',
  RED: 'red',
} as const;
export type ProjectHealth = (typeof ProjectHealth)[keyof typeof ProjectHealth];

export const PROJECT_HEALTH_LABELS: Record<ProjectHealth, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red: 'Critical',
};

export const ProjectPhase = {
  PLANNING: 'planning',
  PROCUREMENT: 'procurement',
  CONSTRUCTION: 'construction',
  COMMISSIONING: 'commissioning',
  OPERATIONAL: 'operational',
} as const;
export type ProjectPhase = (typeof ProjectPhase)[keyof typeof ProjectPhase];

export const SubscriptionStatus = {
  ACTIVE: 'active',
  OPTED_OUT: 'opted_out',
  PAUSED: 'paused',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const DeliverySchedule = {
  INSTANT: 'instant',
  MORNING: 'morning',
  EVENING: 'evening',
  WEEKLY: 'weekly',
} as const;
export type DeliverySchedule = (typeof DeliverySchedule)[keyof typeof DeliverySchedule];

export const BroadcastStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type BroadcastStatus = (typeof BroadcastStatus)[keyof typeof BroadcastStatus];

export const IntentChannel = {
  PWA: 'pwa',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
} as const;
export type IntentChannel = (typeof IntentChannel)[keyof typeof IntentChannel];

export const IntentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;
export type IntentStatus = (typeof IntentStatus)[keyof typeof IntentStatus];

export const IntentAction = {
  PUBLISH: 'publish',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;
export type IntentAction = (typeof IntentAction)[keyof typeof IntentAction];

export const AdvisoryType = {
  LANGUAGE: 'language',
  URGENCY: 'urgency',
  HARM: 'harm',
  SPAM: 'spam',
  CONTENT_QUALITY: 'content_quality',
} as const;
export type AdvisoryType = (typeof AdvisoryType)[keyof typeof AdvisoryType];

export const AuthorityLevel = {
  COMMUNITY_MEMBER: 1,
  VERIFIED_MEMBER: 2,
  COMMUNITY_LEADER: 3,
  NGO_PARTNER: 4,
  NATIONAL_AUTHORITY: 5,
} as const;
export type AuthorityLevel = (typeof AuthorityLevel)[keyof typeof AuthorityLevel];

export const AuthorityScope = {
  COMMUNITY: 'community',
  REGION: 'region',
  PROVINCE: 'province',
  NATIONAL: 'national',
} as const;
export type AuthorityScope = (typeof AuthorityScope)[keyof typeof AuthorityScope];

export const ApprovalMode = {
  ADMIN_REVIEW: 'admin_review',
  AI_REVIEW: 'ai_review',
  AUTO: 'auto',
} as const;
export type ApprovalMode = (typeof ApprovalMode)[keyof typeof ApprovalMode];

export const AuthorityProfileStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const;
export type AuthorityProfileStatus = (typeof AuthorityProfileStatus)[keyof typeof AuthorityProfileStatus];
