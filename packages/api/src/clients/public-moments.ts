import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';
import type { Region, Category } from '@moments/shared';

export interface PublicMoment {
  id: string;
  title: string;
  content: string;
  region: Region;
  category: Category;
  language: string;
  urgencyLevel: string;
  isSponsored: boolean;
  sponsorId: string | null;
  pwaLink: string | null;
  mediaUrls: string[];
  createdAt: string;
  sponsor: { displayName: string; logoUrl: string | null; tier: string } | null;
}

export interface PublicListParams {
  page?: number;
  limit?: number;
  region?: Region;
  category?: Category;
  search?: string;
}

export function createPublicMomentsClient(config: ApiConfig) {
  return {
    list(params?: PublicListParams): Promise<PaginatedResponse<PublicMoment>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moments/public${qs}`);
    },

    get(id: string): Promise<PublicMoment> {
      return apiFetch(config, `/moments/public/${id}`);
    },
  };
}
