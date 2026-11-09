import { apiFetch, type ApiConfig } from '../http';

// ─── Capability groups ────────────────────────────────────────────────────────

export type NodeCapability =
  | 'governance'
  | 'participation'
  | 'evidence'
  | 'commercial'
  | 'tcrs'
  | 'institutional-memory'
  | 'health'
  | 'operators'
  | 'spatial';

// ─── Node identity ────────────────────────────────────────────────────────────

export interface GovernanceNodeLocation {
  province: string;
  district?: string;
  municipality: string;
  locality?: string;
}

export interface GovernanceNodeIdentity {
  id: string;
  name: string;
  authority: string;
  location: GovernanceNodeLocation;
  contractVersion: string;
  capabilities: NodeCapability[];
  timestamp: string;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export type NodeHealthStatus = 'healthy' | 'degraded' | 'unreachable';

export interface NodeHealth {
  status: NodeHealthStatus;
  lastUpdated: string;
  recordCount: number;
  noticeCount: number;
  version: string;
  uptime?: number;
}

// ─── Governance ───────────────────────────────────────────────────────────────

// Geographic reference — attached to records, notices, projects from governance nodes.
// Precision degrades gracefully: coordinates > ward > municipality > district.
// No field is required — use the most specific reference available.
export interface GeoRef {
  district?: string;       // e.g. 'Amajuba'
  municipality?: string;   // e.g. 'Newcastle'
  ward?: string;           // e.g. 'Ward 3'
  locality?: string;       // e.g. 'Madadeni'
  latitude?: number;       // WGS84
  longitude?: number;      // WGS84
  nodeId?: string;         // originating node identifier
  recordId?: string;       // originating record/notice/project id
  recordType?: string;     // 'record' | 'notice' | 'project'
  label?: string;          // display label for map tooltip
  timestamp?: string;      // ISO datetime of the originating record
}

export interface RecordActivityItem {
  id: string;
  title: string;
  type: string;
  status: string | null;
  createdAt: string;
  geoRef?: GeoRef;
  // nodeUrl not used for linking — node frontend uses slugs, not UUIDs
  nodeUrl?: string;
}

export interface RecordsSummary {
  total: number;
  byStatus: {
    pending: number;
    adopted: number;
    approved: number;
    resolved: number;
    rejected: number;
  };
  byType: Record<string, number>;
  recent: RecordActivityItem[];
  timestamp: string;
}

export interface NoticeActivityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  isStatutory: boolean;
  commentDeadline: string | null;
  createdAt: string;
  geoRef?: GeoRef;
  // nodeUrl not used for linking — node frontend uses slugs, not UUIDs
  nodeUrl?: string;
}

export interface NoticesSummary {
  total: number;
  byStatus: {
    draft: number;
    published: number;
    open: number;
    closed: number;
    approved: number;
    rejected: number;
    withdrawn: number;
  };
  byType: Record<string, number>;
  statutory: {
    total: number;
    open: number;
    pendingProof: number;
    averageCommentPeriodDays?: number;
  };
  recentActivity: NoticeActivityItem[];
  timestamp: string;
}

// ─── Participation ────────────────────────────────────────────────────────────

export interface ParticipationSummary {
  total: number;
  byType: {
    comment: number;
    objection: number;
    support: number;
    question: number;
  };
  byRelationship: {
    resident: number;
    landowner: number;
    business: number;
    community: number;
    organisation: number;
    other: number;
  };
  activeNotices: number;
  timestamp: string;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export interface EvidenceSummary {
  total: number;
  byType: {
    image: number;
    document: number;
    video: number;
    audio: number;
    other: number;
  };
  withWeatherContext: number;
  totalSizeBytes?: number;
  timestamp: string;
}

// ─── Commercial ───────────────────────────────────────────────────────────────

export interface CommercialActivityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  health: string | null;
  updatedAt: string;
  geoRef?: GeoRef;
  nodeUrl?: string;
}

export interface CommercialSummary {
  projects: {
    total: number;
    byStatus: {
      draft: number;
      approved: number;
      active: number;
      completed: number;
      reported: number;
    };
    byHealth: {
      green: number;
      amber: number;
      red: number;
    };
    byPhase: {
      planning: number;
      procurement: number;
      construction: number;
      commissioning: number;
      operational: number;
    };
    totalBudget: number;
    totalBeneficiaries: number;
  };
  sponsors: {
    total: number;
    active: number;
  };
  recent: CommercialActivityItem[];
  timestamp: string;
}

// ─── TCRS ─────────────────────────────────────────────────────────────────────

export interface TcrsSummary {
  total: number;
  byResolutionState: {
    pending: number;
    partial: number;
    resolved: number;
    escalated: number;
  };
  escalated: number;
  averageResolutionDays?: number;
  timestamp: string;
}

// ─── Institutional memory ─────────────────────────────────────────────────────

export interface LineageSummary {
  rootRecords: number;
  linkedRecords: number;
  averageChainDepth?: number;
  layer5Outputs: {
    lineageCertificates: number;
    proofOfPublication: number;
    journeyMaps: number;
  };
  timestamp: string;
}

// ─── Operators ───────────────────────────────────────────────────────────────

export interface NodeOperator {
  id: string;
  name: string;
  operatorRole: string;
  organisation: string | null;
  sanityUserId: string | null;
  active: boolean;
  assignedSince: string | null;
  assignedUntil: string | null;
  notes: string | null;
}

export interface OperatorsSummary {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  operators: NodeOperator[];
  timestamp: string;
}

// ─── Record detail (API v1.1) ─────────────────────────────────────────────────

export interface RecordEvidence {
  _key: string;
  title: string;
  url: string | null;
}

export interface RecordDetail {
  _id: string;
  title: string;
  slug: string;
  recordType: string;
  date: string | null;
  summary: string | null;
  status: string | null;
  verificationNote: string | null;
  externalUrl: string | null;
  source: string | null;
  approvedBy: { firstName: string; lastName: string; role: string | null } | null;
  evidence: RecordEvidence[];
  originNotice: { _id: string; title: string; slug: string; noticeType: string; date: string | null } | null;
  parentRecord: { _id: string; title: string; slug: string; recordType: string } | null;
  relatedArea: { name: string; slug: string } | null;
  relatedCampaign: { title: string; slug: string; status: string | null } | null;
  location: string | null;
  attendance: number | null;
  childRecords: { _id: string; title: string; slug: string; recordType: string; date: string | null; status: string | null }[];
}

// ─── Spatial summary (API v1.2) ──────────────────────────────────────────────

export interface NodeMunicipalitySummary {
  name: string;
  slug: string;
  recordCount: number;
  noticeCount: number;
  activeProjects: number;
  activeDevNotices: number;
  boundaryAvailable: boolean;
}

export interface NodeWardSummary {
  wardNumber: number;
  municipality: string;
  recordCount: number;
  activeProjects: number;
  boundaryAvailable: boolean;
}

export interface NodeSpatialSummary {
  municipalities: NodeMunicipalitySummary[];
  wards: NodeWardSummary[];
  geoRefs: GeoRef[];  // all georeferenced activity items from this node
  generatedAt: string;
}



/**
 * Read-only typed client for the Governance Node API contract (v1.0 / v1.1).
 * Pass the node's base URL and its node-issued API key.
 * One client works for every governance node — no node-specific logic here.
 *
 * D-036: No write operations. Ever.
 */
export function createGovernanceNodeClient(config: ApiConfig) {
  const base = '/api/intelligence';

  return {
    /** GET /api/intelligence/node — node identity and capability declaration */
    identity(): Promise<GovernanceNodeIdentity> {
      return apiFetch(config, `${base}/node`);
    },

    /** GET /api/intelligence/health — node health and record counts */
    health(): Promise<NodeHealth> {
      return apiFetch(config, `${base}/health`);
    },

    /** GET /api/intelligence/records/summary — requires `governance` capability */
    recordsSummary(): Promise<RecordsSummary> {
      return apiFetch(config, `${base}/records/summary`);
    },

    /** GET /api/intelligence/notices/summary — requires `governance` capability */
    noticesSummary(): Promise<NoticesSummary> {
      return apiFetch(config, `${base}/notices/summary`);
    },

    /** GET /api/intelligence/participation/summary — requires `participation` capability */
    participationSummary(): Promise<ParticipationSummary> {
      return apiFetch(config, `${base}/participation/summary`);
    },

    /** GET /api/intelligence/evidence/summary — requires `evidence` capability */
    evidenceSummary(): Promise<EvidenceSummary> {
      return apiFetch(config, `${base}/evidence/summary`);
    },

    /** GET /api/intelligence/commercial/summary — requires `commercial` capability */
    commercialSummary(): Promise<CommercialSummary> {
      return apiFetch(config, `${base}/commercial/summary`);
    },

    /** GET /api/intelligence/tcrs/summary — requires `tcrs` capability */
    tcrsSummary(): Promise<TcrsSummary> {
      return apiFetch(config, `${base}/tcrs/summary`);
    },

    /** GET /api/intelligence/lineage/summary — requires `institutional-memory` capability */
    lineageSummary(): Promise<LineageSummary> {
      return apiFetch(config, `${base}/lineage/summary`);
    },

    /** GET /api/intelligence/operators — operator registry for this node */
    operatorsSummary(): Promise<OperatorsSummary> {
      return apiFetch(config, `${base}/operators`);
    },

    /** GET /api/intelligence/records/detail?id=<sanityId> — API v1.1 authoritative record detail */
    recordDetail(sanityId: string): Promise<{ record: RecordDetail; timestamp: string }> {
      return apiFetch(config, `${base}/records/detail?id=${encodeURIComponent(sanityId)}`);
    },

    /** GET /api/intelligence/spatial/summary — API v1.2 — requires `spatial` capability */
    spatialSummary(): Promise<NodeSpatialSummary> {
      return apiFetch(config, `${base}/spatial/summary`);
    },
  };
}

export type GovernanceNodeClient = ReturnType<typeof createGovernanceNodeClient>;
