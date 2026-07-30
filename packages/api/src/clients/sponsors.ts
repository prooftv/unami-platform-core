import { apiFetch, type ApiConfig } from '../http';
import type { Sponsor, PaginatedResponse } from '../types/index';
import type { SponsorTier } from '@moments/shared';

export interface SponsorStats {
  total: number;
  active: number;
  byTier: Record<SponsorTier, number>;
}

export function createSponsorsClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; active?: boolean; tier?: SponsorTier }): Promise<PaginatedResponse<Sponsor>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/sponsors${qs}`);
    },

    get(id: string): Promise<Sponsor> {
      return apiFetch(config, `/sponsors/${id}`);
    },

    stats(): Promise<SponsorStats> {
      return apiFetch(config, '/sponsors/stats');
    },
  };
}
