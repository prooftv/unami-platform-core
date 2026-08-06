import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

// ---------------------------------------------------------------------------
// Types — public surface only. No budget, no transactions, no admin fields.
// ---------------------------------------------------------------------------

export interface PublicProject {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  projectHealth: string | null;
  projectPhase: string | null;
  projectReference: string | null;
  fundingSource: string | null;
  contractor: string | null;
  beneficiaries: number | null;
  impactSummary: string | null;
  lessonsLearned: string | null;
  progressLog: Array<{ date: string; update: string; addedBy: string }>;
  deliverablesCount: number;
  targetRegions: string[];
  mediaUrls: string[];
  sponsor: { displayName: string; logoUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListPublicProjectsParams {
  page?: number;
  limit?: number;
  health?: string;
  region?: string;
}

export function createPublicProjectsClient(config: ApiConfig) {
  return {
    list(params?: ListPublicProjectsParams): Promise<PaginatedResponse<PublicProject>> {
      const raw: Record<string, string> = {};
      if (params?.page)   raw.page   = String(params.page);
      if (params?.limit)  raw.limit  = String(params.limit);
      if (params?.health) raw.health = params.health;
      if (params?.region) raw.region = params.region;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/campaigns/public/projects${qs}`);
    },

    get(id: string): Promise<{ data: PublicProject }> {
      return apiFetch(config, `/campaigns/public/projects/${id}`);
    },
  };
}
