import { apiFetch, type ApiConfig } from '../http';
import type { Message, Advisory, PaginatedResponse } from '../types/index';
import type { ModerationStatus } from '@unami/shared';

export interface ModerationStats {
  pendingMessages: number;
  escalatedAdvisories: number;
  approvedToday: number;
  rejectedToday: number;
  oldestPendingAge: number | null;
  avgReviewTime7d: number | null;
}

export interface MessageWithAdvisories extends Message {
  advisories: Advisory[];
}

export interface Comment {
  id: string;
  momentId: string;
  fromNumber: string;
  content: string;
  moderationStatus: ModerationStatus;
  featured: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  moment?: { title: string } | null;
}

export function createModerationClient(config: ApiConfig) {
  return {
    listMessages(params?: { page?: number; limit?: number; status?: ModerationStatus }): Promise<PaginatedResponse<Message>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/messages${qs}`);
    },

    getMessage(id: string): Promise<MessageWithAdvisories> {
      return apiFetch(config, `/moderation/messages/${id}`);
    },

    listAdvisories(params?: { page?: number; limit?: number; escalated?: boolean }): Promise<PaginatedResponse<Advisory>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/advisories${qs}`);
    },

    getAdvisory(id: string): Promise<Advisory> {
      return apiFetch(config, `/moderation/advisories/${id}`);
    },

    stats(): Promise<ModerationStats> {
      return apiFetch(config, '/moderation/stats');
    },

    approve(messageId: string): Promise<Message> {
      return apiFetch(config, `/moderation/messages/${messageId}/approve`, { method: 'POST' });
    },

    reject(messageId: string): Promise<Message> {
      return apiFetch(config, `/moderation/messages/${messageId}/reject`, { method: 'POST' });
    },

    getThread(maskedPhone: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Message>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/threads/${encodeURIComponent(maskedPhone)}${qs}`);
    },

    listComments(params?: { page?: number; limit?: number; status?: ModerationStatus; momentId?: string }): Promise<PaginatedResponse<Comment>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/comments${qs}`);
    },

    approveComment(id: string): Promise<Comment> {
      return apiFetch(config, `/moderation/comments/${id}/approve`, { method: 'POST' });
    },

    rejectComment(id: string): Promise<Comment> {
      return apiFetch(config, `/moderation/comments/${id}/reject`, { method: 'POST' });
    },
  };
}
