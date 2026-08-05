import { PageHeader } from '@unami/ui';
import { fetchAggregatedRecords, fetchAggregatedNotices } from '@/lib/nodes/fetcher';
import { GovernanceKPIs, RecordsSummaryWidget, NoticesSummaryWidget, RecentRecordsWidget, RecentNoticesWidget } from '@/app/(umkhandlu)/dashboard/widgets/GovernanceWidgets';

export default async function GovernanceIntelligencePage() {
  const [records, notices] = await Promise.all([
    fetchAggregatedRecords(),
    fetchAggregatedNotices(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance Intelligence"
        description="Records and notices aggregated across all connected nodes"
      />
      <GovernanceKPIs records={records} notices={notices} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecordsSummaryWidget summary={records} />
        <NoticesSummaryWidget summary={notices} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentRecordsWidget summary={records} />
        <RecentNoticesWidget summary={notices} />
      </div>
    </div>
  );
}
