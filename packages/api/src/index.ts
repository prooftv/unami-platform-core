export { ApiError } from './http';
export type { ApiConfig } from './http';
export type * from './types/index';
export type { PublicProject, ListPublicProjectsParams } from './clients/public-projects';
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
export type { ParticipationStats, EvidenceStats, ProjectHealthSummary, ActivityEvent } from './types/index';
export type { FeatureFlag, SystemSetting, AuditLogEntry, ErrorLogEntry } from './clients/settings';
export type { UserProfile } from './clients/user-profiles';
export type { MediaRecord, UploadMediaResult } from './clients/media';
export type { PlatformRecord, RecordStatus, CreateRecordInput, UpdateRecordInput, ListRecordsParams } from './clients/records';
export type { GovernanceNotice, GovernanceNoticeType, GovernanceNoticeStatus, CreateNoticeInput, UpdateNoticeInput } from './clients/notices';
export type {
  NodeCapability, NodeHealthStatus,
  GovernanceNodeIdentity, NodeHealth,
  RecordsSummary, NoticesSummary, ParticipationSummary,
  EvidenceSummary, CommercialSummary, TcrsSummary, LineageSummary,
  OperatorsSummary, NodeOperator,
  GovernanceNodeClient,
} from './clients/governance-node';

// UNCIP Reimagined
export type { Province, ChildGender, GuardianRelationship, UNCIPChild, UNCIPGuardianLink, UNCIPChildMedical, CreateChildInput, UpdateChildInput, AddGuardianInput, ListChildrenParams } from './clients/uncip-children';
export type { UNCIPStation, CreateStationInput } from './clients/uncip-stations';
export type { UNCIPSchool, CreateSchoolInput, ListSchoolsParams } from './clients/uncip-schools';
export type { AlertType, AlertStatus, AlertTimelineAction, UNCIPRole, UNCIPAlert, UNCIPAlertTimelineEntry, CreateAlertInput, ChangeAlertStatusInput, ListAlertsParams } from './clients/uncip-alerts';
export type { AddTimelineEntryInput } from './clients/uncip-timeline';
export type { UNCIPMediaScope, UNCIPMediaRow, RequestUploadInput, UploadResult, SignedUrlResult } from './clients/uncip-media';
export type { UNCIPNotification } from './clients/uncip-notifications';

import { createPublicProjectsClient } from './clients/public-projects';
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
import { createRecordsClient, createPublicRecordsClient } from './clients/records';
import { createNoticesClient } from './clients/notices';
import { createGovernanceNodeClient } from './clients/governance-node';
import { createUNCIPChildrenClient } from './clients/uncip-children';
import { createUNCIPStationsClient } from './clients/uncip-stations';
import { createUNCIPSchoolsClient }  from './clients/uncip-schools';
import { createUNCIPAlertsClient }   from './clients/uncip-alerts';
import { createUNCIPTimelineClient } from './clients/uncip-timeline';
import { createUNCIPMediaClient }    from './clients/uncip-media';
import { createUNCIPNotificationsClient } from './clients/uncip-notifications';

export interface ApiClientConfig {
  baseUrl: string;
  token: string;
}

// Public client — uses anon key as token, no user auth required
export function createPublicApiClient(config: ApiClientConfig) {
  return {
    moments:       createPublicMomentsClient(config),
    participation: createPublicParticipationClient(config),
    evidence:      createPublicEvidenceClient(config),
    records:       createPublicRecordsClient(config),
    projects:      createPublicProjectsClient(config),
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
    records:      createRecordsClient(config),
    notices:      createNoticesClient(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Governance Node client — one factory for all nodes.
 * Pass the node's base URL (e.g. https://umkhandlu.unamifoundation.org)
 * and its node-issued read-only API key.
 */
export { createGovernanceNodeClient };

/**
 * UNCIP Reimagined client — authenticated, all five domains.
 * Pass the Supabase Edge Function base URL and the authenticated user's JWT.
 */
export function createUNCIPApiClient(config: ApiClientConfig) {
  return {
    children:      createUNCIPChildrenClient(config),
    stations:      createUNCIPStationsClient(config),
    schools:       createUNCIPSchoolsClient(config),
    alerts:        createUNCIPAlertsClient(config),
    timeline:      createUNCIPTimelineClient(config),
    media:         createUNCIPMediaClient(config),
    notifications: createUNCIPNotificationsClient(config),
  };
}

export type UNCIPApiClient = ReturnType<typeof createUNCIPApiClient>;
