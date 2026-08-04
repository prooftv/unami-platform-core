import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

// Domain types inlined — no import from apps/umkhandlu/domain
export type GovernanceNoticeType =
  | 'meeting' | 'announcement' | 'resolution' | 'alert' | 'opportunity'
  | 'employment' | 'smme' | 'project-update'
  | 'eia' | 'rezoning' | 'land-use' | 'township' | 'building'
  | 'mining' | 'liquor' | 'telecom' | 'estate' | 'liquidation' | 'pto';

export type GovernanceNoticeStatus =
  | 'draft' | 'published' | 'open' | 'closed' | 'approved' | 'rejected' | 'withdrawn' | 'archived';

export interface GovernanceNotice {
  id: string;
  type: GovernanceNoticeType;
  title: string;
  content: string;
  status: GovernanceNoticeStatus;
  isStatutory: boolean;
  commentDeadline: string | null;
  commentsReceived: number;
  weatherContext: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeInput {
  type: GovernanceNoticeType;
  title: string;
  content: string;
  commentDeadline?: string | null;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  status?: GovernanceNoticeStatus;
  commentDeadline?: string | null;
}

export function createNoticesClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; status?: GovernanceNoticeStatus; type?: GovernanceNoticeType }): Promise<PaginatedResponse<GovernanceNotice>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/notices${qs}`);
    },

    get(id: string): Promise<GovernanceNotice> {
      return apiFetch(config, `/notices/${id}`);
    },

    create(input: CreateNoticeInput): Promise<GovernanceNotice> {
      return apiFetch(config, '/notices', {
        method: 'POST',
        body: JSON.stringify({
          type: input.type,
          title: input.title,
          content: input.content,
          comment_deadline: input.commentDeadline ?? null,
        }),
      });
    },

    update(id: string, input: UpdateNoticeInput): Promise<GovernanceNotice> {
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.content !== undefined) body.content = input.content;
      if (input.status !== undefined) body.status = input.status;
      if (input.commentDeadline !== undefined) body.comment_deadline = input.commentDeadline;
      return apiFetch(config, `/notices/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
  };
}
