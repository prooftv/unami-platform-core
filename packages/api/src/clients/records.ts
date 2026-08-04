import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

// Domain types inlined — no import from apps/umkhandlu/domain
export type GovernanceRecordType =
  | 'minutes' | 'resolution' | 'community-decision' | 'land-allocation'
  | 'dispute-resolution' | 'report' | 'infrastructure-concern' | 'project-outcome'
  | 'policy' | 'agenda' | 'public-notice' | 'external-resource';

export type GovernanceRecordStatus = 'pending' | 'adopted' | 'approved' | 'resolved' | 'rejected';

export interface GovernanceRecord {
  id: string;
  type: GovernanceRecordType;
  title: string;
  content: string;
  status: GovernanceRecordStatus;
  authorityId: string | null;
  approvedBy: string | null;
  parentRecordId: string | null;
  originNoticeId: string | null;
  weatherContext: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordInput {
  type: GovernanceRecordType;
  title: string;
  content: string;
  parentRecordId?: string | null;
  originNoticeId?: string | null;
}

export interface UpdateRecordInput {
  title?: string;
  content?: string;
  status?: GovernanceRecordStatus;
  approvedBy?: string | null;
}

export function createRecordsClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; status?: GovernanceRecordStatus; type?: GovernanceRecordType; originNoticeId?: string }): Promise<PaginatedResponse<GovernanceRecord>> {
      const raw: Record<string, string> = {};
      if (params?.page)           raw.page            = String(params.page);
      if (params?.limit)          raw.limit           = String(params.limit);
      if (params?.status)         raw.status          = params.status;
      if (params?.type)           raw.type            = params.type;
      if (params?.originNoticeId) raw.origin_notice_id = params.originNoticeId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/records${qs}`);
    },

    get(id: string): Promise<GovernanceRecord> {
      return apiFetch(config, `/records/${id}`);
    },

    lineage(id: string): Promise<GovernanceRecord[]> {
      return apiFetch(config, `/records/${id}/lineage`);
    },

    create(input: CreateRecordInput): Promise<GovernanceRecord> {
      return apiFetch(config, '/records', {
        method: 'POST',
        body: JSON.stringify({
          type: input.type,
          title: input.title,
          content: input.content,
          parent_record_id: input.parentRecordId ?? null,
          origin_notice_id: input.originNoticeId ?? null,
        }),
      });
    },

    update(id: string, input: UpdateRecordInput): Promise<GovernanceRecord> {
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.content !== undefined) body.content = input.content;
      if (input.status !== undefined) body.status = input.status;
      if (input.approvedBy !== undefined) body.approved_by = input.approvedBy;
      return apiFetch(config, `/records/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
  };
}
