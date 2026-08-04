import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse, MomentType } from '../types/index';
import type { Region, Category } from '../types/index';

// Shape returned by the Edge Function (raw DB columns, snake_case)
interface RawPublicMoment {
  id: string;
  title: string;
  content: string;
  region: Region;
  category: Category;
  language: string;
  urgency_level: string;
  moment_type: MomentType;
  participation_enabled: boolean;
  participation_deadline: string | null;
  is_sponsored: boolean;
  sponsor_id: string | null;
  pwa_link: string | null;
  media_urls: string[];
  created_at: string;
  sponsors: { display_name: string; logo_url: string | null; tier: string } | null;
}

// Camelcase shape consumed by the frontend
export interface PublicMoment {
  id: string;
  title: string;
  content: string;
  region: Region;
  category: Category;
  language: string;
  urgencyLevel: string;
  momentType: MomentType;
  participationEnabled: boolean;
  participationDeadline: string | null;
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

function mapMoment(raw: RawPublicMoment): PublicMoment {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    region: raw.region,
    category: raw.category,
    language: raw.language,
    urgencyLevel: raw.urgency_level,
    momentType: raw.moment_type ?? 'standard',
    participationEnabled: raw.participation_enabled ?? false,
    participationDeadline: raw.participation_deadline ?? null,
    isSponsored: raw.is_sponsored,
    sponsorId: raw.sponsor_id,
    pwaLink: raw.pwa_link,
    mediaUrls: raw.media_urls,
    createdAt: raw.created_at,
    sponsor: raw.sponsors
      ? { displayName: raw.sponsors.display_name, logoUrl: raw.sponsors.logo_url, tier: raw.sponsors.tier }
      : null,
  };
}

export function createPublicMomentsClient(config: ApiConfig) {
  return {
    async list(params?: PublicListParams): Promise<PaginatedResponse<PublicMoment>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      const raw = await apiFetch<PaginatedResponse<RawPublicMoment>>(config, `/moments/public${qs}`);
      return { ...raw, data: raw.data.map(mapMoment) };
    },

    async get(id: string): Promise<PublicMoment> {
      const raw = await apiFetch<RawPublicMoment>(config, `/moments/public/${id}`);
      return mapMoment(raw);
    },
  };
}
