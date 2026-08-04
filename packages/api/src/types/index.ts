export type { Pagination, PaginatedResponse, AdminUser, SystemSetting, Message } from '@unami/shared';

// API response envelope
export interface ApiResponse<T> {
  data: T;
  pagination?: import('@unami/shared').Pagination;
}

// Broadcast result
export interface BroadcastResult {
  broadcastId: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: 'completed' | 'failed';
}

// Auth session — returned by Edge Function GET /auth/me
export interface AuthSession {
  id: string;
  email: string;
  role: 'superadmin' | 'content_admin' | 'moderator' | 'viewer';
  authority_id: string | null;
}

// Admin session — serialisable contract passed from server layout to client shell
export interface AdminSession {
  id: string;
  email: string;
  name: string | null;
  role: 'superadmin' | 'content_admin' | 'moderator' | 'viewer';
  authority_id: string | null;
}

// ---------------------------------------------------------------------------
// Moments domain types — inlined here so packages/api has no domain dependency
// ---------------------------------------------------------------------------

export type MomentStatus = 'draft' | 'scheduled' | 'broadcasted' | 'cancelled';
export type ContentSource = 'admin' | 'community' | 'whatsapp' | 'campaign';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';
export type MomentType = 'standard' | 'community' | 'opportunity' | 'infrastructure' | 'consultation';
export type Category = 'Education' | 'Safety' | 'Culture' | 'Opportunity' | 'Events' | 'Health' | 'Technology' | 'Community';
export type Region = 'KZN' | 'WC' | 'GP' | 'EC' | 'FS' | 'LP' | 'MP' | 'NC' | 'NW' | 'National';
export type SponsorTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CampaignStatus = 'pending_review' | 'approved' | 'active' | 'paused' | 'completed' | 'cancelled' | 'published';
export type CampaignType = 'ad' | 'activation' | 'csr';
export type ProjectHealth = 'green' | 'amber' | 'red';
export type ProjectPhase = 'planning' | 'procurement' | 'construction' | 'commissioning' | 'operational';
export type DeliverySchedule = 'instant' | 'morning' | 'evening' | 'weekly';
export type BroadcastStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AuthorityLevel = 1 | 2 | 3 | 4 | 5;
export type AuthorityScope = 'community' | 'region' | 'province' | 'national';
export type ApprovalMode = 'admin_review' | 'ai_review' | 'auto';
export type AuthorityProfileStatus = 'active' | 'suspended' | 'expired';
export type AdvisoryType = 'language' | 'urgency' | 'harm' | 'spam' | 'content_quality';

export interface Moment {
  id: string;
  title: string;
  content: string;
  rawContent: string | null;
  region: Region;
  category: Category;
  language: string;
  sponsorId: string | null;
  isSponsored: boolean;
  pwaLink: string | null;
  mediaUrls: string[];
  scheduledAt: string | null;
  broadcastedAt: string | null;
  status: MomentStatus;
  urgencyLevel: UrgencyLevel;
  momentType: MomentType;
  participationEnabled: boolean;
  participationDeadline: string | null;
  contentSource: ContentSource;
  createdBy: string | null;
  publishToWhatsapp: boolean;
  publishToPwa: boolean;
  digestSent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MomentWithSponsor extends Moment {
  sponsor: Pick<Sponsor, 'displayName' | 'logoUrl' | 'tier'> | null;
}

export interface Sponsor {
  id: string;
  name: string;
  displayName: string;
  contactEmail: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: SponsorTier;
  monthlyBudget: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertifiedDeliverable {
  id: string;
  task: string;
  status: 'pending' | 'certified' | 'disputed';
  certifiedBy: string;
  percentageComplete: number;
  weightage: number;
  certificationDate: string | null;
  notes: string;
}

export interface ProgressLogEntry {
  date: string;
  update: string;
  addedBy: string;
}

export interface Campaign {
  id: string;
  title: string;
  content: string;
  category: Category;
  sponsorId: string | null;
  budget: number;
  targetRegions: Region[];
  targetCategories: Category[];
  mediaUrls: string[];
  scheduledAt: string | null;
  status: CampaignStatus;
  templateName: string | null;
  createdBy: string | null;
  campaignType: CampaignType;
  projectHealth: ProjectHealth | null;
  projectPhase: ProjectPhase | null;
  projectReference: string | null;
  fundingSource: string | null;
  contractor: string | null;
  beneficiaries: number | null;
  impactSummary: string | null;
  lessonsLearned: string | null;
  progressLog: ProgressLogEntry[];
  deliverablesCertified: CertifiedDeliverable[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithSponsor extends Campaign {
  sponsor: Pick<Sponsor, 'displayName'> | null;
}

export interface Subscription {
  id: string;
  phoneNumber: string;
  optedIn: boolean;
  regions: Region[];
  categories: Category[];
  languagePreference: string;
  deliverySchedule: DeliverySchedule;
  pausedUntil: string | null;
  optedInAt: string;
  optedOutAt: string | null;
  lastActivity: string;
  consentTimestamp: string | null;
  consentMethod: string | null;
  doubleOptInConfirmed: boolean;
  createdAt: string;
}

export interface Broadcast {
  id: string;
  momentId: string;
  campaignId: string | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  broadcastStartedAt: string;
  broadcastCompletedAt: string | null;
  status: BroadcastStatus;
  authorityContext: Record<string, unknown> | null;
  errorDetails: Record<string, unknown> | null;
  createdAt: string;
}

export interface BroadcastWithMoment extends Broadcast {
  moment: Pick<Moment, 'title' | 'region' | 'category'>;
}

export interface HarmSignals {
  violence: boolean;
  harassment: boolean;
  threats: boolean;
  hateSpeech: boolean;
}

export interface SpamIndicators {
  promotional: boolean;
  repetitive: boolean;
  links: boolean;
  financialFraud: boolean;
}

export interface Advisory {
  id: string;
  messageId: string | null;
  momentId: string | null;
  advisoryType: AdvisoryType;
  confidence: number;
  harmSignals: HarmSignals | null;
  spamIndicators: SpamIndicators | null;
  urgencyLevel: UrgencyLevel;
  escalationSuggested: boolean;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuthorityProfile {
  id: string;
  userIdentifier: string;
  authorityLevel: AuthorityLevel;
  roleLabel: string;
  scope: AuthorityScope;
  scopeIdentifier: string | null;
  approvalMode: ApprovalMode;
  blastRadius: number;
  riskThreshold: number;
  status: AuthorityProfileStatus;
  validUntil: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalMoments: number;
  broadcastedMoments: number;
  communityMoments: number;
  adminMoments: number;
  campaignMoments: number;
  totalBroadcasts: number;
  successfulBroadcasts: number;
  pendingBroadcasts: number;
  failedBroadcasts: number;
  successRate: string;
  totalSubscribers: number;
  activeSubscribers: number;
  recentActivity: number;
  systemStatus: {
    intentSystem: 'healthy' | 'backlog';
    lastUpdated: string;
  };
}

export interface RevenueAnalytics {
  totalCampaigns: number;
  totalRevenue30Days: number;
  totalBudgetAllocated: number;
  totalSpent: number;
  totalBroadcasts: number;
  avgCostPerBroadcast: number;
  roi: string;
  profitMargin: string;
  budgetUtilization: string;
}

export interface DailyStats {
  statDate: string;
  momentsCount: number;
  broadcastsCount: number;
  newSubscribers: number;
}

export interface RegionalStats {
  region: Region;
  momentCount: number;
}

export interface CategoryStats {
  category: Category;
  momentCount: number;
}

export interface ParticipationStats {
  total: number;
  byType: Record<string, number>;
  byRelationship: Record<string, number>;
  consultationMoments: number;
  avgPerMoment: number;
}

export interface EvidenceStats {
  total: number;
  byType: Record<string, number>;
  totalBytes: number;
  momentsWithEvidence: number;
}

export interface ProjectHealthSummary {
  total: number;
  active: number;
  byHealth: Record<string, number>;
  byPhase: Record<string, number>;
  totalBeneficiaries: number;
}

export interface ActivityEvent {
  type: 'moment' | 'broadcast' | 'participation' | 'evidence';
  id: string;
  label: string;
  meta: string;
  timestamp: string;
}
