import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getNodeClient } from '@/lib/api/client';
import type { NodeWithHealth } from '@/app/(umkhandlu)/dashboard/widgets/OverviewWidgets';
import type {
  RecordsSummary,
  NoticesSummary,
  CommercialSummary,
  LineageSummary,
  TcrsSummary,
  ParticipationSummary,
  EvidenceSummary,
  OperatorsSummary,
  GovernanceNodeIdentity,
} from '@unami/api';

export interface GovernanceNodeRow {
  id: string;
  node_id: string | null;
  name: string;
  authority: string;
  location: string | null;
  url: string;
  api_key: string;
  active: boolean;
  contract_version: string;
  capabilities: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function getRegisteredNodes(): Promise<GovernanceNodeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('governance_nodes')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as GovernanceNodeRow[];
}

export async function getAllNodes(): Promise<GovernanceNodeRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('governance_nodes')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[getAllNodes] Supabase error:', error.message, error.code);
    return [];
  }
  return (data ?? []) as GovernanceNodeRow[];
}

export async function fetchRegisteredNodes(): Promise<NodeWithHealth[]> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return [];

  const results = await Promise.all(
    nodes.map(async (node) => {
      const client = getNodeClient(node.url, node.api_key);
      const [identity, health] = await Promise.all([
        safe(() => client.identity()),
        safe(() => client.health()),
      ]);
      if (!identity) return null;
      return { identity, health };
    }),
  );

  return results.filter((n): n is NodeWithHealth => n !== null);
}

export async function fetchAggregatedRecords(): Promise<RecordsSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const pairs = (await Promise.all(
    nodes.map(async (n) => {
      const r = await safe(() => getNodeClient(n.url, n.api_key).recordsSummary());
      return r ? { nodeUrl: n.url, summary: r } : null;
    }),
  )).filter((p): p is { nodeUrl: string; summary: RecordsSummary } => p !== null);
  if (pairs.length === 0) return null;
  return pairs.reduce((acc, { nodeUrl, summary: r }) => ({
    ...r,
    total: acc.total + r.total,
    byStatus: {
      pending:  acc.byStatus.pending  + r.byStatus.pending,
      adopted:  acc.byStatus.adopted  + r.byStatus.adopted,
      approved: acc.byStatus.approved + r.byStatus.approved,
      resolved: acc.byStatus.resolved + r.byStatus.resolved,
      rejected: acc.byStatus.rejected + r.byStatus.rejected,
    },
    recent: [...acc.recent, ...r.recent.map((i) => ({ ...i, nodeUrl }))].slice(0, 10),
  }), { ...pairs[0].summary, recent: [] as RecordsSummary['recent'], total: 0, byStatus: { pending: 0, adopted: 0, approved: 0, resolved: 0, rejected: 0 } });
}

export async function fetchAggregatedNotices(): Promise<NoticesSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const pairs = (await Promise.all(
    nodes.map(async (n) => {
      const r = await safe(() => getNodeClient(n.url, n.api_key).noticesSummary());
      return r ? { nodeUrl: n.url, summary: r } : null;
    }),
  )).filter((p): p is { nodeUrl: string; summary: NoticesSummary } => p !== null);
  if (pairs.length === 0) return null;
  return pairs.reduce((acc, { nodeUrl, summary: r }) => ({
    ...r,
    total: acc.total + r.total,
    byStatus: {
      draft:     acc.byStatus.draft     + r.byStatus.draft,
      published: acc.byStatus.published + r.byStatus.published,
      open:      acc.byStatus.open      + r.byStatus.open,
      closed:    acc.byStatus.closed    + r.byStatus.closed,
      approved:  acc.byStatus.approved  + r.byStatus.approved,
      rejected:  acc.byStatus.rejected  + r.byStatus.rejected,
      withdrawn: acc.byStatus.withdrawn + r.byStatus.withdrawn,
    },
    statutory: {
      total:        acc.statutory.total        + r.statutory.total,
      open:         acc.statutory.open         + r.statutory.open,
      pendingProof: acc.statutory.pendingProof + r.statutory.pendingProof,
    },
    recentActivity: [...acc.recentActivity, ...r.recentActivity.map((i) => ({ ...i, nodeUrl }))].slice(0, 10),
  }), { ...pairs[0].summary, recentActivity: [] as NoticesSummary['recentActivity'], total: 0, byStatus: { draft: 0, published: 0, open: 0, closed: 0, approved: 0, rejected: 0, withdrawn: 0 }, statutory: { total: 0, open: 0, pendingProof: 0 } });
}

export async function fetchAggregatedCommercial(): Promise<CommercialSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const pairs = (await Promise.all(
    nodes.map(async (n) => {
      const r = await safe(() => getNodeClient(n.url, n.api_key).commercialSummary());
      return r ? { nodeUrl: n.url, summary: r } : null;
    }),
  )).filter((p): p is { nodeUrl: string; summary: CommercialSummary } => p !== null);
  if (pairs.length === 0) return null;
  return pairs.reduce((acc, { nodeUrl, summary: r }) => ({
    ...r,
    projects: {
      ...r.projects,
      total:              acc.projects.total              + r.projects.total,
      totalBudget:        acc.projects.totalBudget        + r.projects.totalBudget,
      totalBeneficiaries: acc.projects.totalBeneficiaries + r.projects.totalBeneficiaries,
      byStatus: {
        draft:     acc.projects.byStatus.draft     + r.projects.byStatus.draft,
        approved:  acc.projects.byStatus.approved  + r.projects.byStatus.approved,
        active:    acc.projects.byStatus.active    + r.projects.byStatus.active,
        completed: acc.projects.byStatus.completed + r.projects.byStatus.completed,
        reported:  acc.projects.byStatus.reported  + r.projects.byStatus.reported,
      },
      byHealth: {
        green: acc.projects.byHealth.green + r.projects.byHealth.green,
        amber: acc.projects.byHealth.amber + r.projects.byHealth.amber,
        red:   acc.projects.byHealth.red   + r.projects.byHealth.red,
      },
    },
    sponsors: {
      total:  acc.sponsors.total  + r.sponsors.total,
      active: acc.sponsors.active + r.sponsors.active,
    },
    recent: [...acc.recent, ...r.recent.map((i) => ({ ...i, nodeUrl }))].slice(0, 10),
  }), { ...pairs[0].summary, recent: [] as CommercialSummary['recent'], projects: { ...pairs[0].summary.projects, total: 0, totalBudget: 0, totalBeneficiaries: 0, byStatus: { draft: 0, approved: 0, active: 0, completed: 0, reported: 0 }, byHealth: { green: 0, amber: 0, red: 0 } }, sponsors: { total: 0, active: 0 } });
}

export interface NodeSnapshot {
  id: string;
  name: string;
  authority: string;
  url: string;
  health: import('@unami/api').NodeHealth | null;
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
  commercial: CommercialSummary | null;
}

export async function fetchNodeSnapshots(): Promise<NodeSnapshot[]> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return [];
  return Promise.all(
    nodes.map(async (n) => {
      const client = getNodeClient(n.url, n.api_key);
      const [health, records, notices, commercial] = await Promise.all([
        safe(() => client.health()),
        safe(() => client.recordsSummary()),
        safe(() => client.noticesSummary()),
        safe(() => client.commercialSummary()),
      ]);
      return { id: n.id, name: n.name, authority: n.authority, url: n.url, health, records, notices, commercial };
    }),
  );
}

export async function fetchAggregatedLineage(): Promise<LineageSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const results = await Promise.all(
    nodes.map((n) => safe(() => getNodeClient(n.url, n.api_key).lineageSummary())),
  );
  const valid = results.filter((r): r is LineageSummary => r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((acc, r) => ({
    ...r,
    rootRecords:   acc.rootRecords   + r.rootRecords,
    linkedRecords: acc.linkedRecords + r.linkedRecords,
    layer5Outputs: {
      lineageCertificates: acc.layer5Outputs.lineageCertificates + r.layer5Outputs.lineageCertificates,
      proofOfPublication:  acc.layer5Outputs.proofOfPublication  + r.layer5Outputs.proofOfPublication,
      journeyMaps:         acc.layer5Outputs.journeyMaps         + r.layer5Outputs.journeyMaps,
    },
  }));
}

export async function fetchAggregatedTcrs(): Promise<TcrsSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const results = await Promise.all(
    nodes.map((n) => safe(() => getNodeClient(n.url, n.api_key).tcrsSummary())),
  );
  const valid = results.filter((r): r is TcrsSummary => r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((acc, r) => ({
    ...r,
    total:     acc.total     + r.total,
    escalated: acc.escalated + r.escalated,
    byResolutionState: {
      pending:   acc.byResolutionState.pending   + r.byResolutionState.pending,
      partial:   acc.byResolutionState.partial   + r.byResolutionState.partial,
      resolved:  acc.byResolutionState.resolved  + r.byResolutionState.resolved,
      escalated: acc.byResolutionState.escalated + r.byResolutionState.escalated,
    },
  }));
}

export async function fetchAggregatedParticipation(): Promise<ParticipationSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const results = await Promise.all(
    nodes.map((n) => safe(() => getNodeClient(n.url, n.api_key).participationSummary())),
  );
  const valid = results.filter((r): r is ParticipationSummary => r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((acc, r) => ({
    ...r,
    total:         acc.total         + r.total,
    activeNotices: acc.activeNotices + r.activeNotices,
    byType: {
      comment:   acc.byType.comment   + r.byType.comment,
      objection: acc.byType.objection + r.byType.objection,
      support:   acc.byType.support   + r.byType.support,
      question:  acc.byType.question  + r.byType.question,
    },
    byRelationship: {
      resident:     acc.byRelationship.resident     + r.byRelationship.resident,
      landowner:    acc.byRelationship.landowner    + r.byRelationship.landowner,
      business:     acc.byRelationship.business     + r.byRelationship.business,
      community:    acc.byRelationship.community    + r.byRelationship.community,
      organisation: acc.byRelationship.organisation + r.byRelationship.organisation,
      other:        acc.byRelationship.other        + r.byRelationship.other,
    },
  }));
}

/**
 * Reads anonymised participation intelligence from the Control Centre's own
 * participation_signals table (ufsmpqxniswdnsywjzje).
 *
 * This is the canonical live source for participation signals.
 * activeNotices is governance content — sourced from the node Intelligence API.
 *
 * @param sanityId — when provided, returns the signal for a specific record/notice.
 *                   When omitted, returns an aggregate across all signals for all nodes.
 */
export async function fetchParticipationSignals(
  sanityId?: string,
): Promise<ParticipationSummary | null> {
  const supabase = await createServiceClient();

  let query = supabase
    .from('participation_signals')
    .select('response_count, by_type, by_relationship, last_submission');

  if (sanityId) {
    query = query.eq('sanity_id', sanityId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) return null;

  // Aggregate all matching signal rows into a single ParticipationSummary
  const byType = { comment: 0, support: 0, objection: 0, question: 0 };
  const byRelationship = { resident: 0, landowner: 0, business: 0, community: 0, organisation: 0, other: 0 };
  let total = 0;

  for (const row of data) {
    total += row.response_count ?? 0;
    const bt = row.by_type as Record<string, number> ?? {};
    const br = row.by_relationship as Record<string, number> ?? {};
    for (const k of Object.keys(byType) as (keyof typeof byType)[]) {
      byType[k] += bt[k] ?? 0;
    }
    for (const k of Object.keys(byRelationship) as (keyof typeof byRelationship)[]) {
      byRelationship[k] += br[k] ?? 0;
    }
  }

  // activeNotices is governance content — source from node Intelligence API
  const nodes = await getRegisteredNodes();
  const nodeResults = await Promise.all(
    nodes.map((n) => safe(() => getNodeClient(n.url, n.api_key).participationSummary())),
  );
  const activeNotices = nodeResults
    .filter((r): r is ParticipationSummary => r !== null)
    .reduce((sum, r) => sum + r.activeNotices, 0);

  return { total, byType, byRelationship, activeNotices, timestamp: new Date().toISOString() };
}

/**
 * Fetch participation intelligence for a specific record, scoped by BOTH
 * node_id and sanity_id to prevent cross-node sanity_id collisions.
 *
 * nodeUrl is resolved to governance_nodes.node_id via the registry.
 * Returns null if the node has no node_id seeded or no signals exist.
 */
export async function fetchRecordParticipation(
  nodeUrl: string,
  sanityId: string,
): Promise<{ total: number; byType: Record<string, number>; byRelationship: Record<string, number>; lastSubmission: string | null } | null> {
  // Resolve nodeUrl → node_id via the registry
  const supabase = createServiceClient();
  const { data: nodeRow } = await supabase
    .from('governance_nodes')
    .select('node_id')
    .eq('url', nodeUrl)
    .maybeSingle();

  const nodeId = nodeRow?.node_id;
  if (!nodeId) return null;

  const { data, error } = await supabase
    .from('participation_signals')
    .select('response_count, by_type, by_relationship, last_submission')
    .eq('node_id', nodeId)
    .eq('sanity_id', sanityId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    total: data.response_count ?? 0,
    byType: (data.by_type as Record<string, number>) ?? {},
    byRelationship: (data.by_relationship as Record<string, number>) ?? {},
    lastSubmission: data.last_submission ?? null,
  };
}

export async function fetchAggregatedEvidence(): Promise<EvidenceSummary | null> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return null;
  const results = await Promise.all(
    nodes.map((n) => safe(() => getNodeClient(n.url, n.api_key).evidenceSummary())),
  );
  const valid = results.filter((r): r is EvidenceSummary => r !== null);
  if (valid.length === 0) return null;
  return valid.reduce((acc, r) => ({
    ...r,
    total:              acc.total              + r.total,
    withWeatherContext: acc.withWeatherContext + r.withWeatherContext,
    byType: {
      image:    acc.byType.image    + r.byType.image,
      document: acc.byType.document + r.byType.document,
      video:    acc.byType.video    + r.byType.video,
      audio:    acc.byType.audio    + r.byType.audio,
      other:    acc.byType.other    + r.byType.other,
    },
  }));
}

export interface NodeOperatorsSummary {
  nodeId: string;
  nodeName: string;
  nodeAuthority: string;
  summary: OperatorsSummary;
}

export async function fetchAllNodeOperators(): Promise<NodeOperatorsSummary[]> {
  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) return [];
  const results = await Promise.all(
    nodes.map(async (n) => {
      const summary = await safe(() => getNodeClient(n.url, n.api_key).operatorsSummary());
      if (!summary) return null;
      return { nodeId: n.id, nodeName: n.name, nodeAuthority: n.authority, summary };
    }),
  );
  return results.filter((r): r is NodeOperatorsSummary => r !== null);
}

export async function fetchNodeIdentity(nodeId: string): Promise<{ node: GovernanceNodeRow; identity: GovernanceNodeIdentity; operators: OperatorsSummary | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('governance_nodes')
    .select('*')
    .eq('id', nodeId)
    .single();
  if (error || !data) return null;
  const node = data as GovernanceNodeRow;
  const client = getNodeClient(node.url, node.api_key);
  const [identity, operators] = await Promise.all([
    safe(() => client.identity()),
    safe(() => client.operatorsSummary()),
  ]);
  if (!identity) return null;
  return { node, identity, operators };
}
