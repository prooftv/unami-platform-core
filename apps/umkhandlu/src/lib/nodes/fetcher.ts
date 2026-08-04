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

// Phase 18B: single node from env. Phase 18C adds registry table for multi-node.
const NODE_URL = process.env.UMKHANDLU_NODE_URL ?? 'https://umkhandlu.unamifoundation.org';
const NODE_KEY = process.env.UMKHANDLU_NODE_API_KEY ?? '';

function client() {
  return getNodeClient(NODE_URL, NODE_KEY);
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function fetchRegisteredNodes(): Promise<NodeWithHealth[]> {
  if (!NODE_KEY) return [];
  const [identity, health] = await Promise.all([
    safe(() => client().identity()),
    safe(() => client().health()),
  ]);
  if (!identity) return [];
  return [{ identity, health }];
}

export async function fetchAggregatedRecords(): Promise<RecordsSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().recordsSummary());
}

export async function fetchAggregatedNotices(): Promise<NoticesSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().noticesSummary());
}

export async function fetchAggregatedCommercial(): Promise<CommercialSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().commercialSummary());
}

export async function fetchAggregatedLineage(): Promise<LineageSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().lineageSummary());
}

export async function fetchAggregatedTcrs(): Promise<TcrsSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().tcrsSummary());
}

export async function fetchAggregatedParticipation(): Promise<ParticipationSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().participationSummary());
}

export async function fetchAggregatedEvidence(): Promise<EvidenceSummary | null> {
  if (!NODE_KEY) return null;
  return safe(() => client().evidenceSummary());
}
