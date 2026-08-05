import { getOperatorSession } from '@/lib/auth/operator';
import {
  fetchRegisteredNodes,
  fetchNodeSnapshots,
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

  const [nodes, snapshots, records, notices, commercial, lineage, tcrs, participation, evidence] = await Promise.all([
    fetchRegisteredNodes(),
    fetchNodeSnapshots(),
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
      overview={{ nodes, records, notices, tcrs }}
      nodes={{ snapshots }}
      governance={{ records, notices }}
      commercial={{ commercial }}
      memory={{ lineage, tcrs }}
      platform={{ nodes, participation, evidence }}
    />
  );
}
