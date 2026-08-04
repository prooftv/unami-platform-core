export { ApiError } from './http';
export type { ApiConfig } from './http';
export type * from './types/index';
export type { PublicMoment, PublicListParams } from './clients/public-moments';
export type { ParticipationResponseType, ParticipationRelationship, SubmitParticipationInput, ParticipationResult } from './clients/participation';
export type { EvidenceRecord, UploadEvidenceInput } from './clients/evidence';
export type { MomentType } from './types/index';

export type { SubscriberStats } from './clients/subscribers';
export type { ModerationStats, MessageWithAdvisories, Comment } from './clients/moderation';
export type { AuthorityAuditEntry, AuthorityStats, CreateAuthorityInput, UpdateAuthorityInput } from './clients/authority';
export type { SponsorStats, CreateSponsorInput, UpdateSponsorInput } from './clients/sponsors';
export type { CampaignBudgetEntry, BudgetTransaction, CreateCampaignInput, UpdateCampaignInput, AddProgressInput, CertifyDeliverableInput } from './clients/campaigns';
export type { IntentStats } from './clients/analytics';
export type { FeatureFlag, SystemSetting, AuditLogEntry, ErrorLogEntry } from './clients/settings';
export type { UserProfile } from './clients/user-profiles';
export type { MediaRecord, UploadMediaResult } from './clients/media';

import { createPublicMomentsClient } from './clients/public-moments';
import { createPublicParticipationClient } from './clients/participation';
import { createEvidenceClient, createPublicEvidenceClient } from './clients/evidence';
import { createMomentsClient } from './clients/moments';
import { createBroadcastsClient } from './clients/broadcasts';
import { createAuthClient } from './clients/auth';
import { createSubscribersClient } from './clients/subscribers';
import { createModerationClient } from './clients/moderation';
import { createAuthorityClient } from './clients/authority';
import { createSponsorsClient } from './clients/sponsors';
import { createCampaignsClient } from './clients/campaigns';
import { createAnalyticsClient } from './clients/analytics';
import { createSettingsClient } from './clients/settings';
import { createUserProfilesClient } from './clients/user-profiles';
import { createMediaClient } from './clients/media';

export interface ApiClientConfig {
  baseUrl: string;
  token: string;
}

// Public client — uses anon key as token, no user auth required
export function createPublicApiClient(config: ApiClientConfig) {
  return {
    moments: createPublicMomentsClient(config),
    participation: createPublicParticipationClient(config),
    evidence: createPublicEvidenceClient(config),
  };
}

export type PublicApiClient = ReturnType<typeof createPublicApiClient>;

export function createApiClient(config: ApiClientConfig) {
  return {
    moments:     createMomentsClient(config),
    broadcasts:  createBroadcastsClient(config),
    auth:        createAuthClient(config),
    subscribers: createSubscribersClient(config),
    moderation:  createModerationClient(config),
    authority:   createAuthorityClient(config),
    sponsors:    createSponsorsClient(config),
    campaigns:   createCampaignsClient(config),
    analytics:    createAnalyticsClient(config),
    settings:     createSettingsClient(config),
    userProfiles: createUserProfilesClient(config),
    media:        createMediaClient(config),
    evidence:     createEvidenceClient(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
