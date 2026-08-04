import { apiFetch, type ApiConfig } from '../http';
import type {
  DashboardMetrics,
  RevenueAnalytics,
  DailyStats,
  RegionalStats,
  CategoryStats,
  ParticipationStats,
  EvidenceStats,
  ProjectHealthSummary,
  ActivityEvent,
} from '../types/index';

export interface IntentStats {
  pending: number;
  processing: number;
  failed: number;
  lastProcessedAt: string | null;
}

export function createAnalyticsClient(config: ApiConfig) {
  return {
    dashboardMetrics(): Promise<DashboardMetrics> {
      return apiFetch(config, '/analytics/dashboard');
    },

    dailyStats(days?: number): Promise<DailyStats[]> {
      const qs = days ? `?days=${days}` : '';
      return apiFetch(config, `/analytics/daily${qs}`);
    },

    regionalStats(): Promise<RegionalStats[]> {
      return apiFetch(config, '/analytics/regional');
    },

    categoryStats(): Promise<CategoryStats[]> {
      return apiFetch(config, '/analytics/categories');
    },

    revenueAnalytics(): Promise<RevenueAnalytics> {
      return apiFetch(config, '/analytics/revenue');
    },

    intentStats(): Promise<IntentStats> {
      return apiFetch(config, '/analytics/intents');
    },

    participationStats(): Promise<ParticipationStats> {
      return apiFetch(config, '/analytics/participation');
    },

    evidenceStats(): Promise<EvidenceStats> {
      return apiFetch(config, '/analytics/evidence');
    },

    projectHealthSummary(): Promise<ProjectHealthSummary> {
      return apiFetch(config, '/analytics/project-health');
    },

    activityStream(limit?: number): Promise<ActivityEvent[]> {
      const qs = limit ? `?limit=${limit}` : '';
      return apiFetch(config, `/analytics/activity${qs}`);
    },
  };
}
