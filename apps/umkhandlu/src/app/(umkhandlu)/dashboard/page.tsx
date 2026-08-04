import { getOperatorSession } from '@/lib/auth/operator';
import {
  fetchRegisteredNodes,
  fetchAggregatedRecords,
  fetchAggregatedNotices,
  fetchAggregatedCommercial,
  fetchAggregatedLineage,
  fetchAggregatedTcrs,
  fetchAggregatedParticipation,
  fetchAggregatedEvidence,
} from '@/lib/nodes/fetcher';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await getOperatorSession();

  const nodes = await fetchRegisteredNodes();

  const [records, notices, commercial, lineage, tcrs, participation, evidence] = await Promise.all([
    fetchAggregatedRecords(),
    fetchAggregatedNotices(),
    fetchAggregatedCommercial(),
    fetchAggregatedLineage(),
    fetchAggregatedTcrs(),
    fetchAggregatedParticipation(),
    fetchAggregatedEvidence(),
  ]);

  return (
    <DashboardClient
      operatorEmail={session!.email}
      overview={{ nodes }}
      nodes={{ nodes }}
      governance={{ records, notices }}
      commercial={{ commercial }}
      memory={{ lineage, tcrs }}
      platform={{ nodes, participation, evidence }}
    />
  );
}
