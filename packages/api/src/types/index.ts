// Re-export domain types from shared — API package does not duplicate them
export type {
  Moment,
  MomentWithSponsor,
  Sponsor,
  Campaign,
  CampaignWithSponsor,
  Broadcast,
  BroadcastWithMoment,
  Subscription,
  MomentIntent,
  Message,
  Advisory,
  AuthorityProfile,
  AdminUser,
  SystemSetting,
  DashboardMetrics,
  RevenueAnalytics,
  DailyStats,
  RegionalStats,
  CategoryStats,
} from '@moments/shared';

import type { Pagination } from '@moments/shared';
export type { Pagination };
export type PaginatedResponse<T> = import('@moments/shared').PaginatedResponse<T>;

// API response envelope
export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

// Broadcast result
export interface BroadcastResult {
  broadcastId: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: 'completed' | 'failed';
}

// Auth session — returned by Edge Function /auth/me
export interface AuthSession {
  userId: string;
  email: string;
  role: 'superadmin' | 'content_admin' | 'moderator' | 'viewer';
  accessToken: string;
}

// Admin session — serialisable contract passed from server layout to client shell
// Does not carry accessToken (stays server-side only)
export interface AdminSession {
  userId: string;
  email: string;
  name: string | null;
  role: 'superadmin' | 'content_admin' | 'moderator' | 'viewer';
}
