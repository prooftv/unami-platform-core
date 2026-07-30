import { apiFetch, type ApiConfig } from '../http';
import type { AuthorityProfile, PaginatedResponse } from '../types/index';
import type { AuthorityLevel, AuthorityScope } from '@moments/shared';

export interface AuthorityAuditEntry {
  id: string;
  authorityId: string;
  actionType: string;
  authorityLevel: AuthorityLevel;
  scope: AuthorityScope;
  blastRadiusApplied: number;
  performedAt: string;
}

export interface AuthorityStats {
  total: number;
  active: number;
  byLevel: Record<string, number>;
  actionsToday: number;
  actionsLast7d: number;
}

export function createAuthorityClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<AuthorityProfile>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/authority${qs}`);
    },

    get(id: string): Promise<AuthorityProfile> {
      return apiFetch(config, `/authority/${id}`);
    },

    auditLog(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<AuthorityAuditEntry>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/authority/audit${qs}`);
    },

    stats(): Promise<AuthorityStats> {
      return apiFetch(config, '/authority/stats');
    },
  };
}
