import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  reputationScore: number;
  totalComments: number;
  totalFeatured: number;
  createdAt: string;
  updatedAt: string;
}

export function createUserProfilesClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<UserProfile>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/user-profiles${qs}`);
    },

    get(id: string): Promise<UserProfile> {
      return apiFetch(config, `/user-profiles/${id}`);
    },
  };
}
