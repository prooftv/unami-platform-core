import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

// ---------------------------------------------------------------------------
// Types — platform concepts only.
// type is a plain string — the calling application owns vocabulary.
// No GovernanceRecordType enum. No Moments enum.
// ---------------------------------------------------------------------------

export type RecordStatus = 'pending' | 'adopted' | 'approved' | 'resolved' | 'rejected';

export interface PlatformRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  status: RecordStatus;
  authorityId: string | null;
  approvedBy: string | null;
  parentRecordId: string | null;
  originNoticeId: string | null;
  momentId: string | null;
  weatherContext: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordInput {
  type: string;
  title: string;
  content: string;
  approvedBy?: string | null;
  parentRecordId?: string | null;
  originNoticeId?: string | null;
  momentId?: string | null;
}

export interface UpdateRecordInput {
  title?: string;
  content?: string;
  approvedBy?: string | null;
}

export interface ListRecordsParams {
  page?: number;
  limit?: number;
  status?: RecordStatus;
  type?: string;
  momentId?: string;
  originNoticeId?: string;
}

// ---------------------------------------------------------------------------
// Authenticated client — used by apps/admin
// ---------------------------------------------------------------------------

export function createRecordsClient(config: ApiConfig) {
  return {
    list(params?: ListRecordsParams): Promise<PaginatedResponse<PlatformRecord>> {
      const raw: Record<string, string> = {};
      if (params?.page)           raw.page             = String(params.page);
      if (params?.limit)          raw.limit            = String(params.limit);
      if (params?.status)         raw.status           = params.status;
      if (params?.type)           raw.type             = params.type;
      if (params?.momentId)       raw.moment_id        = params.momentId;
      if (params?.originNoticeId) raw.origin_notice_id = params.originNoticeId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/records${qs}`);
    },

    get(id: string): Promise<{ data: PlatformRecord }> {
      return apiFetch(config, `/records/${id}`);
    },

    lineage(id: string): Promise<{ data: PlatformRecord[] }> {
      return apiFetch(config, `/records/${id}/lineage`);
    },

    create(input: CreateRecordInput): Promise<{ data: PlatformRecord }> {
      return apiFetch(config, '/records', {
        method: 'POST',
        body: JSON.stringify({
          type:             input.type,
          title:            input.title,
          content:          input.content,
          approved_by:      input.approvedBy ?? null,
          parent_record_id: input.parentRecordId ?? null,
          origin_notice_id: input.originNoticeId ?? null,
          moment_id:        input.momentId ?? null,
        }),
      });
    },

    update(id: string, input: UpdateRecordInput): Promise<{ data: PlatformRecord }> {
      const body: Record<string, unknown> = {};
      if (input.title       !== undefined) body.title       = input.title;
      if (input.content     !== undefined) body.content     = input.content;
      if (input.approvedBy  !== undefined) body.approved_by = input.approvedBy;
      return apiFetch(config, `/records/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },

    transitionStatus(id: string, status: RecordStatus): Promise<{ data: PlatformRecord }> {
      return apiFetch(config, `/records/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Public client — anon key, read-only, used by apps/web
// ---------------------------------------------------------------------------

export function createPublicRecordsClient(config: ApiConfig) {
  return {
    list(params?: Pick<ListRecordsParams, 'page' | 'limit' | 'momentId'>): Promise<PaginatedResponse<PlatformRecord>> {
      const raw: Record<string, string> = {};
      if (params?.page)     raw.page      = String(params.page);
      if (params?.limit)    raw.limit     = String(params.limit);
      if (params?.momentId) raw.moment_id = params.momentId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/records${qs}`);
    },

    get(id: string): Promise<{ data: PlatformRecord }> {
      return apiFetch(config, `/records/${id}`);
    },

    lineage(id: string): Promise<{ data: PlatformRecord[] }> {
      return apiFetch(config, `/records/${id}/lineage`);
    },
  };
}
