import { apiFetch, type ApiConfig } from '../http';
import type { Moment, MomentWithSponsor, PaginatedResponse, MomentStatus, MomentType, Region, Category, UrgencyLevel } from '../types/index';

export interface CreateMomentInput {
  title: string;
  content: string;
  region: Region;
  category: Category;
  language?: string;
  sponsorId?: string | null;
  isSponsored?: boolean;
  pwaLink?: string | null;
  mediaUrls?: string[];
  scheduledAt?: string | null;
  urgencyLevel?: UrgencyLevel;
  momentType?: MomentType;
  participationEnabled?: boolean;
  participationDeadline?: string | null;
  publishToPwa?: boolean;
  publishToWhatsapp?: boolean;
}

export type UpdateMomentInput = Partial<CreateMomentInput>;

export interface ListMomentsInput {
  page?: number;
  limit?: number;
  status?: MomentStatus;
  region?: Region;
  category?: Category;
  source?: string;
  search?: string;
}

export interface ScheduleMomentInput {
  scheduledAt: string;
}

export function createMomentsClient(config: ApiConfig) {
  return {
    list(params?: ListMomentsInput): Promise<PaginatedResponse<MomentWithSponsor>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moments${qs}`);
    },

    get(id: string): Promise<MomentWithSponsor> {
      return apiFetch(config, `/moments/${id}`);
    },

    create(input: CreateMomentInput): Promise<Moment> {
      return apiFetch(config, '/moments', { method: 'POST', body: JSON.stringify(input) });
    },

    update(id: string, input: UpdateMomentInput): Promise<Moment> {
      return apiFetch(config, `/moments/${id}`, { method: 'PUT', body: JSON.stringify(input) });
    },

    delete(id: string): Promise<{ success: boolean }> {
      return apiFetch(config, `/moments/${id}`, { method: 'DELETE' });
    },

    schedule(id: string, input: ScheduleMomentInput): Promise<Moment> {
      return apiFetch(config, `/moments/${id}/schedule`, { method: 'POST', body: JSON.stringify(input) });
    },

    cancel(id: string): Promise<Moment> {
      return apiFetch(config, `/moments/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) });
    },

    stats(id: string): Promise<{ viewCount: number; commentCount: number; shareCount: number; reactionCount: number; updatedAt: string }> {
      return apiFetch(config, `/moments/${id}/stats`);
    },
  };
}
