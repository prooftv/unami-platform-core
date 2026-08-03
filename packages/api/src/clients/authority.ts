import { apiFetch, type ApiConfig } from '../http';
import type { AuthorityProfile, PaginatedResponse } from '../types/index';
import type { AuthorityLevel, AuthorityScope, ApprovalMode } from '@unami/shared';

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

export interface CreateAuthorityInput {
  userIdentifier: string;
  authorityLevel: number;
  roleLabel: string;
  scope: AuthorityScope;
  scopeIdentifier?: string | null;
  approvalMode?: ApprovalMode;
  blastRadius?: number;
  riskThreshold?: number;
  validUntil?: string | null;
}

export type UpdateAuthorityInput = Partial<Omit<CreateAuthorityInput, 'userIdentifier'>>;

export function createAuthorityClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<AuthorityProfile>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/authority${qs}`);
    },

    get(id: string): Promise<AuthorityProfile> {
      return apiFetch(config, `/authority/${id}`);
    },

    create(input: CreateAuthorityInput): Promise<AuthorityProfile> {
      // Map camelCase to snake_case for Edge Function
      const body = {
        user_identifier: input.userIdentifier,
        authority_level: input.authorityLevel,
        role_label: input.roleLabel,
        scope: input.scope,
        scope_identifier: input.scopeIdentifier ?? null,
        approval_mode: input.approvalMode ?? 'admin_review',
        blast_radius: input.blastRadius ?? 100,
        risk_threshold: input.riskThreshold ?? 0.7,
        valid_until: input.validUntil ?? null,
      };
      return apiFetch(config, '/authority', { method: 'POST', body: JSON.stringify(body) });
    },

    update(id: string, input: UpdateAuthorityInput): Promise<AuthorityProfile> {
      const body: Record<string, unknown> = {};
      if (input.authorityLevel !== undefined) body.authority_level = input.authorityLevel;
      if (input.roleLabel !== undefined) body.role_label = input.roleLabel;
      if (input.scope !== undefined) body.scope = input.scope;
      if (input.scopeIdentifier !== undefined) body.scope_identifier = input.scopeIdentifier;
      if (input.approvalMode !== undefined) body.approval_mode = input.approvalMode;
      if (input.blastRadius !== undefined) body.blast_radius = input.blastRadius;
      if (input.riskThreshold !== undefined) body.risk_threshold = input.riskThreshold;
      if (input.validUntil !== undefined) body.valid_until = input.validUntil;
      return apiFetch(config, `/authority/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },

    suspend(id: string, reason: string): Promise<AuthorityProfile> {
      return apiFetch(config, `/authority/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
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
