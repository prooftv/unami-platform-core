import { getApiClient } from '@/lib/api/client';
import type {
  BroadcastWithMoment,
  DailyStats,
  RegionalStats,
  CategoryStats,
  RevenueAnalytics,
  CampaignBudgetEntry,
  SubscriberStats,
  ModerationStats,
  AuthorityAuditEntry,
  AuthorityStats,
  SponsorStats,
  IntentStats,
} from '@moments/api';

// ── Operations ────────────────────────────────────────────────────────────────

export async function fetchRecentBroadcastsFull(): Promise<BroadcastWithMoment[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.broadcasts.list({ limit: 10 });
    return res.data;
  } catch {
    return [];
  }
}

export async function fetchIntentStats(): Promise<IntentStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.analytics.intentStats();
  } catch {
    return null;
  }
}

// ── Publishing ────────────────────────────────────────────────────────────────

export async function fetchCategoryStats(): Promise<CategoryStats[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    return await api.analytics.categoryStats();
  } catch {
    return [];
  }
}

export async function fetchRegionalStats(): Promise<RegionalStats[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    return await api.analytics.regionalStats();
  } catch {
    return [];
  }
}

// ── Audience ──────────────────────────────────────────────────────────────────

export async function fetchSubscriberStats(): Promise<SubscriberStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.subscribers.stats();
  } catch {
    return null;
  }
}

export async function fetchDailyStats(days = 30): Promise<DailyStats[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    return await api.analytics.dailyStats(days);
  } catch {
    return [];
  }
}

// ── Governance ────────────────────────────────────────────────────────────────

export async function fetchModerationStatsFull(): Promise<ModerationStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.moderation.stats();
  } catch {
    return null;
  }
}

export async function fetchAuthorityAuditLog(): Promise<AuthorityAuditEntry[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.authority.auditLog({ limit: 10 });
    return res.data;
  } catch {
    return [];
  }
}

export async function fetchAuthorityStats(): Promise<AuthorityStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.authority.stats();
  } catch {
    return null;
  }
}

// ── Commercial ────────────────────────────────────────────────────────────────

export async function fetchCampaignBudget(): Promise<CampaignBudgetEntry[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    return await api.campaigns.budgetOverview();
  } catch {
    return [];
  }
}

export async function fetchSponsorStats(): Promise<SponsorStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.sponsors.stats();
  } catch {
    return null;
  }
}

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.analytics.revenueAnalytics();
  } catch {
    return null;
  }
}
