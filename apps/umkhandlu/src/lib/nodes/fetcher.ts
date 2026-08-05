import { createClient } from '@/lib/supabase/server';
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
} from '@unami/api';

export interface GovernanceNodeRow {
  id: string;
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
