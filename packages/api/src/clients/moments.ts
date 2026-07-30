import { apiFetch, type ApiConfig } from '../http';
import type { Moment, MomentWithSponsor, PaginatedResponse } from '../types/index';
import type {
  CreateMomentInput,
  UpdateMomentInput,
  ListMomentsInput,
  ScheduleMomentInput,
} from '@moments/shared';

export function createMomentsClient(config: ApiConfig) {
  return {
    list(params?: Partial<ListMomentsInput>): Promise<PaginatedResponse<MomentWithSponsor>> {
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
  };
}
