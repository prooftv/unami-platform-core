import type {
  MomentStatus,
  ContentSource,
  UrgencyLevel,
  Category,
  Region,
  SponsorTier,
  CampaignStatus,
  DeliverySchedule,
  BroadcastStatus,
  IntentChannel,
  IntentStatus,
  IntentAction,
  AdvisoryType,
  AuthorityLevel,
  AuthorityScope,
  ApprovalMode,
  AuthorityProfileStatus,
} from './enums';
import type { Language } from '@unami/shared';

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

export interface Moment {
  id: string;
  title: string;
  content: string;
  rawContent: string | null;
  region: Region;
  category: Category;
  language: Language;
  sponsorId: string | null;
  isSponsored: boolean;
  pwaLink: string | null;
  mediaUrls: string[];
  scheduledAt: string | null;
  broadcastedAt: string | null;
  status: MomentStatus;
  urgencyLevel: UrgencyLevel;
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

// ---------------------------------------------------------------------------
// Sponsor
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

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
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithSponsor extends Campaign {
  sponsor: Pick<Sponsor, 'displayName'> | null;
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export interface Subscription {
  id: string;
  phoneNumber: string;
  optedIn: boolean;
  regions: Region[];
  categories: Category[];
  languagePreference: Language;
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

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MomentIntent
// ---------------------------------------------------------------------------

export interface MomentIntent {
  id: string;
  momentId: string;
  channel: IntentChannel;
  action: IntentAction;
  status: IntentStatus;
  templateId: string | null;
  payload: Record<string, unknown> | null;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Advisory (MCP analysis result)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// AuthorityProfile
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

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

export interface BudgetOverview {
  total: number;
  used: number;
  messageCost: number;
  messagesSent: number;
  messagesRemaining: number;
}

export interface ComplianceResult {
  isCompliant: boolean;
  riskScore: number;
  violationSeverity: 'SAFE' | 'WARN' | 'SUSPEND';
  violations: string[];
  requiresApproval: boolean;
  recommendation: string;
}
