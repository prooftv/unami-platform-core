// Umkhandlu domain enums
// Lives in apps/umkhandlu/src/domain/umkhandlu/ — never in packages/shared
// Governance vocabulary specific to traditional authority context

export const RecordType = {
  MINUTES: 'minutes',
  RESOLUTION: 'resolution',
  COMMUNITY_DECISION: 'community-decision',
  LAND_ALLOCATION: 'land-allocation',
  DISPUTE_RESOLUTION: 'dispute-resolution',
  REPORT: 'report',
  INFRASTRUCTURE_CONCERN: 'infrastructure-concern',
  PROJECT_OUTCOME: 'project-outcome',
  POLICY: 'policy',
  AGENDA: 'agenda',
  PUBLIC_NOTICE: 'public-notice',
  EXTERNAL_RESOURCE: 'external-resource',
} as const;

export type RecordType = (typeof RecordType)[keyof typeof RecordType];

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  minutes: 'Minutes',
  resolution: 'Resolution',
  'community-decision': 'Community Decision',
  'land-allocation': 'Land Allocation',
  'dispute-resolution': 'Dispute Resolution',
  report: 'Report',
  'infrastructure-concern': 'Infrastructure Concern',
  'project-outcome': 'Project Outcome',
  policy: 'Policy',
  agenda: 'Agenda',
  'public-notice': 'Public Notice',
  'external-resource': 'External Resource',
};

export const RecordStatus = {
  PENDING: 'pending',
  ADOPTED: 'adopted',
  APPROVED: 'approved',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;

export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  pending: 'Pending',
  adopted: 'Adopted',
  approved: 'Approved',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const NoticeType = {
  // Community notices
  MEETING: 'meeting',
  ANNOUNCEMENT: 'announcement',
  RESOLUTION: 'resolution',
  ALERT: 'alert',
  OPPORTUNITY: 'opportunity',
  EMPLOYMENT: 'employment',
  SMME: 'smme',
  PROJECT_UPDATE: 'project-update',
  // Statutory notices
  EIA: 'eia',
  REZONING: 'rezoning',
  LAND_USE: 'land-use',
  TOWNSHIP: 'township',
  BUILDING: 'building',
  MINING: 'mining',
  LIQUOR: 'liquor',
  TELECOM: 'telecom',
  ESTATE: 'estate',
  LIQUIDATION: 'liquidation',
  PTO: 'pto',
} as const;

export type NoticeType = (typeof NoticeType)[keyof typeof NoticeType];

export const STATUTORY_NOTICE_TYPES: NoticeType[] = [
  'eia', 'rezoning', 'land-use', 'township', 'building',
  'mining', 'liquor', 'telecom', 'estate', 'liquidation', 'pto',
];

export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  meeting: 'Meeting',
  announcement: 'Announcement',
  resolution: 'Resolution',
  alert: 'Alert',
  opportunity: 'Opportunity',
  employment: 'Employment',
  smme: 'SMME',
  'project-update': 'Project Update',
  eia: 'EIA',
  rezoning: 'Rezoning',
  'land-use': 'Land Use',
  township: 'Township',
  building: 'Building',
  mining: 'Mining',
  liquor: 'Liquor',
  telecom: 'Telecom',
  estate: 'Estate',
  liquidation: 'Liquidation',
  pto: 'PTO',
};

export const NoticeStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  OPEN: 'open',
  CLOSED: 'closed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  ARCHIVED: 'archived',
} as const;

export type NoticeStatus = (typeof NoticeStatus)[keyof typeof NoticeStatus];

export const GovernanceRole = {
  INKOSI: 'inkosi',
  INDUNA: 'induna',
  COUNCILLOR: 'councillor',
  OFFICIAL: 'official',
  OPERATOR: 'operator',
} as const;

export type GovernanceRole = (typeof GovernanceRole)[keyof typeof GovernanceRole];

export const GOVERNANCE_ROLE_LABELS: Record<GovernanceRole, string> = {
  inkosi: 'Inkosi',
  induna: 'Induna',
  councillor: 'Councillor',
  official: 'Official',
  operator: 'Operator',
};

export const FundingSource = {
  EPWP: 'epwp',
  MIG: 'mig',
  WSIG: 'wsig',
  RBIG: 'rbig',
  OWN_FUNDS: 'own-funds',
  PRIVATE: 'private',
} as const;

export type FundingSource = (typeof FundingSource)[keyof typeof FundingSource];

export const FUNDING_SOURCE_LABELS: Record<FundingSource, string> = {
  epwp: 'EPWP',
  mig: 'MIG',
  wsig: 'WSIG',
  rbig: 'RBIG',
  'own-funds': 'Own Funds',
  private: 'Private',
};
