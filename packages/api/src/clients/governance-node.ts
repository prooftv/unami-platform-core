import { apiFetch, type ApiConfig } from '../http';

// ─── Capability groups ────────────────────────────────────────────────────────

export type NodeCapability =
  | 'governance'
  | 'participation'
  | 'evidence'
  | 'commercial'
  | 'tcrs'
  | 'institutional-memory'
  | 'health';

// ─── Node identity ────────────────────────────────────────────────────────────

export interface GovernanceNodeIdentity {
  id: string;
  name: string;
  authority: string;
  location: string;
  version: string;
  contractVersion: string;
  capabilities: NodeCapability[];
  timezone: string;
  // optional
  description?: string;
  website?: string;
  logo?: string;
  contactEmail?: string;
  establishedDate?: string;
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

export interface RecordActivityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
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
  recentActivity: RecordActivityItem[];
  generatedAt: string;
}

export interface NoticeActivityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  isStatutory: boolean;
  commentDeadline: string | null;
  createdAt: string;
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
  generatedAt: string;
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
  generatedAt: string;
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
  generatedAt: string;
}

// ─── Commercial ───────────────────────────────────────────────────────────────

export interface CommercialActivityItem {
  id: string;
  title: string;
  type: string;
  status: string;
  health: string | null;
  updatedAt: string;
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
  recentActivity: CommercialActivityItem[];
  generatedAt: string;
}

// ─── TCRS ─────────────────────────────────────────────────────────────────────

export interface TcrsSummary {
  total: number;
  byResolutionState: {
    pending: number;
    resolved: number;
    escalated: number;
  };
  escalated: number;
  averageResolutionDays?: number;
  generatedAt: string;
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
  generatedAt: string;
}

// ─── Client factory ───────────────────────────────────────────────────────────

/**
 * Read-only typed client for the Governance Node API contract (v1.0).
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
  };
}

export type GovernanceNodeClient = ReturnType<typeof createGovernanceNodeClient>;
