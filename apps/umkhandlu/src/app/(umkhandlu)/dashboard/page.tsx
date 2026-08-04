import { getOperatorSession } from '@/lib/auth/operator';
import { DashboardClient } from './DashboardClient';
import type { NodeWithHealth } from './widgets/OverviewWidgets';
import type {
  RecordsSummary,
  NoticesSummary,
  CommercialSummary,
  LineageSummary,
  TcrsSummary,
  ParticipationSummary,
  EvidenceSummary,
  GovernanceNodeIdentity,
  NodeHealth,
} from '@unami/api';

// ── Node fetch helpers ────────────────────────────────────────────────────────
// Phase 18B: node list comes from registry. For now, stub returns empty.
// Replace with: const nodes = await fetchNodeRegistry();

async function fetchNodeIdentity(_baseUrl: string, _apiKey: string): Promise<GovernanceNodeIdentity | null> {
  return null; // Phase 18B: implement via createGovernanceNodeClient
}

async function fetchNodeHealth(_baseUrl: string, _apiKey: string): Promise<NodeHealth | null> {
  return null; // Phase 18B: implement via createGovernanceNodeClient
}

async function fetchRegisteredNodes(): Promise<NodeWithHealth[]> {
  // Phase 18B: query node registry table, fetch identity + health per node in parallel
  // For now returns empty — dashboard renders gracefully with no nodes
  return [];
}

// ── Governance data helpers ───────────────────────────────────────────────────
// Phase 18B: these call createGovernanceNodeClient(nodeConfig).recordsSummary() etc.
// Aggregation across multiple nodes happens here before passing to sections.

async function fetchAggregatedRecords(_nodes: NodeWithHealth[]): Promise<RecordsSummary | null> {
  return null;
}

async function fetchAggregatedNotices(_nodes: NodeWithHealth[]): Promise<NoticesSummary | null> {
  return null;
}

async function fetchAggregatedCommercial(_nodes: NodeWithHealth[]): Promise<CommercialSummary | null> {
  return null;
}

async function fetchAggregatedLineage(_nodes: NodeWithHealth[]): Promise<LineageSummary | null> {
  return null;
}

async function fetchAggregatedTcrs(_nodes: NodeWithHealth[]): Promise<TcrsSummary | null> {
  return null;
}

async function fetchAggregatedParticipation(_nodes: NodeWithHealth[]): Promise<ParticipationSummary | null> {
  return null;
}

async function fetchAggregatedEvidence(_nodes: NodeWithHealth[]): Promise<EvidenceSummary | null> {
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getOperatorSession();

  // Step 1: fetch node registry (identity + health per node)
  const nodes = await fetchRegisteredNodes();

  // Step 2: fetch all intelligence data in parallel — each fails gracefully to null
  const [records, notices, commercial, lineage, tcrs, participation, evidence] = await Promise.all([
    fetchAggregatedRecords(nodes),
    fetchAggregatedNotices(nodes),
    fetchAggregatedCommercial(nodes),
    fetchAggregatedLineage(nodes),
    fetchAggregatedTcrs(nodes),
    fetchAggregatedParticipation(nodes),
    fetchAggregatedEvidence(nodes),
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
