import { getApiClient } from '@/lib/api/client';
import type { DashboardMetrics, MomentWithSponsor, BroadcastWithMoment } from '@moments/api';
import type { ModerationStats } from '@moments/api';

// ── Dashboard Metrics ─────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(): Promise<DashboardMetrics | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.analytics.dashboardMetrics();
  } catch {
    return null;
  }
}

// ── Broadcast Queue (draft + scheduled moments) ───────────────────────────────

export async function fetchBroadcastQueue(): Promise<MomentWithSponsor[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.moments.list({ status: 'draft', limit: 10 });
    return res.data;
  } catch {
    return [];
  }
}

// ── Moderation Queue stats ────────────────────────────────────────────────────

export async function fetchModerationStats(): Promise<ModerationStats | null> {
  try {
    const api = await getApiClient();
    if (!api) return null;
    return await api.moderation.stats();
  } catch {
    return null;
  }
}

// ── Recent Moments ────────────────────────────────────────────────────────────

export async function fetchRecentMoments(): Promise<MomentWithSponsor[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.moments.list({ limit: 5 });
    return res.data;
  } catch {
    return [];
  }
}

// ── Upcoming Scheduled ────────────────────────────────────────────────────────

export async function fetchScheduledMoments(): Promise<MomentWithSponsor[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.moments.list({ status: 'scheduled', limit: 5 });
    return res.data;
  } catch {
    return [];
  }
}

// ── Recent Broadcasts ─────────────────────────────────────────────────────────

export async function fetchRecentBroadcasts(): Promise<BroadcastWithMoment[]> {
  try {
    const api = await getApiClient();
    if (!api) return [];
    const res = await api.broadcasts.list({ limit: 5 });
    return res.data;
  } catch {
    return [];
  }
}
