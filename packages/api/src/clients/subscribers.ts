import { apiFetch, type ApiConfig } from '../http';
import type { Subscription, PaginatedResponse } from '../types/index';
import type { Region, DeliverySchedule } from '@moments/shared';

export interface SubscriberStats {
  total: number;
  active: number;
  optedOut: number;
  bySchedule: Record<DeliverySchedule, number>;
  byRegion: Record<Region, number>;
  newToday: number;
  optOutRate7d: number;
}

export function createSubscribersClient(config: ApiConfig) {
  return {
    list(params?: { page?: number; limit?: number; region?: Region; opted_in?: boolean }): Promise<PaginatedResponse<Subscription>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/subscribers${qs}`);
    },

    get(id: string): Promise<Subscription> {
      return apiFetch(config, `/subscribers/${id}`);
    },

    stats(): Promise<SubscriberStats> {
      return apiFetch(config, '/subscribers/stats');
    },
  };
}
