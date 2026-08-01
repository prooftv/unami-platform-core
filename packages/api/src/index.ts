export { ApiError } from './http';
export type { ApiConfig } from './http';
export type * from './types/index';

export type { SubscriberStats } from './clients/subscribers';
export type { ModerationStats, MessageWithAdvisories, Comment } from './clients/moderation';
export type { AuthorityAuditEntry, AuthorityStats, CreateAuthorityInput, UpdateAuthorityInput } from './clients/authority';
export type { SponsorStats, CreateSponsorInput, UpdateSponsorInput } from './clients/sponsors';
export type { CampaignBudgetEntry, BudgetTransaction, CreateCampaignInput, UpdateCampaignInput } from './clients/campaigns';
export type { IntentStats } from './clients/analytics';
export type { FeatureFlag, SystemSetting, AuditLogEntry, ErrorLogEntry } from './clients/settings';

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

export interface ApiClientConfig {
  baseUrl: string;
  token: string;
}

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
    analytics:   createAnalyticsClient(config),
    settings:    createSettingsClient(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
