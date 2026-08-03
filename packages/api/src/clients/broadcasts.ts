import { apiFetch, type ApiConfig } from '../http';
import type { Broadcast, BroadcastWithMoment, PaginatedResponse, BroadcastResult } from '../types/index';

export function createBroadcastsClient(config: ApiConfig) {
  return {
    trigger(momentId: string): Promise<BroadcastResult> {
      return apiFetch(config, `/broadcast/${momentId}`, { method: 'POST' });
    },

    list(params?: { page?: number; limit?: number; momentId?: string }): Promise<PaginatedResponse<BroadcastWithMoment>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/broadcasts${qs}`);
    },

    get(id: string): Promise<Broadcast> {
      return apiFetch(config, `/broadcasts/${id}`);
    },

    retry(): Promise<{ retried: number; skipped: number }> {
      return apiFetch(config, '/retry-batches', { method: 'POST' });
    },
  };
}
