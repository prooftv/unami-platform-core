import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { DashboardClient } from './DashboardClient';
import {
  fetchDashboardMetrics,
  fetchBroadcastQueue,
  fetchModerationStats,
  fetchRecentMoments,
  fetchScheduledMoments,
  fetchRecentBroadcasts,
} from './providers/overview';
import {
  fetchRecentBroadcastsFull,
  fetchIntentStats,
  fetchCategoryStats,
  fetchRegionalStats,
  fetchSubscriberStats,
  fetchDailyStats,
  fetchModerationStatsFull,
  fetchAuthorityAuditLog,
  fetchAuthorityStats,
  fetchCampaignBudget,
  fetchSponsorStats,
  fetchRevenueAnalytics,
  fetchParticipationStats,
  fetchEvidenceStats,
  fetchProjectHealthSummary,
  fetchActivityStream,
} from './providers/sections';

export default async function DashboardPage() {
  const session = await getOperatorSession();

  // Fetch all data in parallel — each provider fails gracefully to null/[]
  const [
    metrics,
    queueMoments,
    moderationStats,
    recentMoments,
    scheduledMoments,
    recentBroadcasts,
    broadcastsFull,
    intentStats,
    categoryStats,
    regionalStats,
    subscriberStats,
    dailyStats,
    modStatsFull,
    authorityEntries,
    authorityStats,
    campaigns,
    sponsorStats,
    revenue,
    participation,
    evidence,
    projectHealth,
    activity,
  ] = await Promise.all([
    fetchDashboardMetrics(),
    fetchBroadcastQueue(),
    fetchModerationStats(),
    fetchRecentMoments(),
    fetchScheduledMoments(),
    fetchRecentBroadcasts(),
    fetchRecentBroadcastsFull(),
    fetchIntentStats(),
    fetchCategoryStats(),
    fetchRegionalStats(),
    fetchSubscriberStats(),
    fetchDailyStats(30),
    fetchModerationStatsFull(),
    fetchAuthorityAuditLog(),
    fetchAuthorityStats(),
    fetchCampaignBudget(),
    fetchSponsorStats(),
    fetchRevenueAnalytics(),
    fetchParticipationStats(),
    fetchEvidenceStats(),
    fetchProjectHealthSummary(),
    fetchActivityStream(),
  ]);

  return (
    <DashboardClient
      session={session!}
      overview={{ metrics, queueMoments, moderationStats, recentMoments, scheduledMoments, recentBroadcasts }}
      operations={{ broadcasts: broadcastsFull, intentStats }}
      publishing={{ moments: recentMoments, categoryStats, regionalStats }}
      audience={{ subscriberStats, dailyStats }}
      governance={{ modStats: modStatsFull, authorityEntries, authorityStats }}
      commercial={{ campaigns, sponsorStats, revenue }}
      intelligence={{ participation, evidence, projectHealth, activity }}
      platform={{ metrics }}
    />
  );
}
