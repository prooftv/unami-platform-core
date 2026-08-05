'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  NodeStatusBanner,
  OverviewKPIs,
  NodeHealthListWidget,
  NodeCapabilityMatrixWidget,
  CrossNodeWidget,
  type NodeWithHealth,
} from './widgets/OverviewWidgets';
import {
  GovernanceKPIs,
  RecordsSummaryWidget,
  NoticesSummaryWidget,
  RecentRecordsWidget,
  RecentNoticesWidget,
} from './widgets/GovernanceWidgets';
import {
  CommercialKPIs,
  ProjectHealthWidget,
  ProjectStatusWidget,
  RecentCommercialActivityWidget,
} from './widgets/CommercialWidgets';
import {
  MemoryKPIs,
  Layer5OutputsWidget,
  TcrsSummaryWidget,
  LineageCoverageWidget,
} from './widgets/MemoryWidgets';
import type {
  RecordsSummary,
  NoticesSummary,
  CommercialSummary,
  LineageSummary,
  TcrsSummary,
  ParticipationSummary,
  EvidenceSummary,
} from '@unami/api';
import type { NodeSnapshot } from '@/lib/nodes/fetcher';

// ── Grid primitives ───────────────────────────────────────────────────────────

function WidgetGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">{children}</div>;
}
function Col12({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-2 lg:col-span-12">{children}</div>;
}
function Col6({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-1 lg:col-span-6">{children}</div>;
}
function Col4({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-1 lg:col-span-4">{children}</div>;
}
function Col8({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-2 lg:col-span-8">{children}</div>;
}

// ── Skeleton states ───────────────────────────────────────────────────────────

export function KPIGridSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function WidgetGridSkeleton({ cols = 2 }: { cols?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="col-span-1 md:col-span-1 lg:col-span-6 rounded-lg border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// ── Section prop types ────────────────────────────────────────────────────────

export type OverviewProps = {
  nodes: NodeWithHealth[];
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
  tcrs: TcrsSummary | null;
};

export type NodesProps = {
  snapshots: NodeSnapshot[];
};

export type GovernanceProps = {
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
};

export type CommercialProps = {
  commercial: CommercialSummary | null;
};

export type MemoryProps = {
  lineage: LineageSummary | null;
  tcrs: TcrsSummary | null;
};

export type PlatformProps = {
  nodes: NodeWithHealth[];
  participation: ParticipationSummary | null;
  evidence: EvidenceSummary | null;
};

// ── Section components ────────────────────────────────────────────────────────

export function OverviewSection({ nodes, records, notices, tcrs }: OverviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <NodeStatusBanner nodes={nodes} />
      <OverviewKPIs nodes={nodes} records={records} notices={notices} tcrs={tcrs} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NodeHealthListWidget nodes={nodes} />
        <NodeCapabilityMatrixWidget nodes={nodes} />
      </div>
    </div>
  );
}

export function NodesSection({ snapshots }: NodesProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <CrossNodeWidget snapshots={snapshots} />
    </div>
  );
}

export function GovernanceSection({ records, notices }: GovernanceProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <GovernanceKPIs records={records} notices={notices} />
      <WidgetGrid>
        <Col6><RecordsSummaryWidget summary={records} /></Col6>
        <Col6><NoticesSummaryWidget summary={notices} /></Col6>
      </WidgetGrid>
      <WidgetGrid>
        <Col6><RecentRecordsWidget summary={records} /></Col6>
        <Col6><RecentNoticesWidget summary={notices} /></Col6>
      </WidgetGrid>
    </div>
  );
}

export function CommercialSection({ commercial }: CommercialProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <CommercialKPIs summary={commercial} />
      <WidgetGrid>
        <Col4><ProjectHealthWidget summary={commercial} /></Col4>
        <Col4><ProjectStatusWidget summary={commercial} /></Col4>
        <Col4><RecentCommercialActivityWidget summary={commercial} /></Col4>
      </WidgetGrid>
    </div>
  );
}

export function MemorySection({ lineage, tcrs }: MemoryProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <MemoryKPIs lineage={lineage} tcrs={tcrs} />
      <WidgetGrid>
        <Col4><LineageCoverageWidget summary={lineage} /></Col4>
        <Col4><Layer5OutputsWidget summary={lineage} /></Col4>
        <Col4><TcrsSummaryWidget summary={tcrs} /></Col4>
      </WidgetGrid>
    </div>
  );
}

export function PlatformSection({ nodes, participation, evidence }: PlatformProps) {
  const healthy     = nodes.filter((n) => n.health?.status === 'healthy').length;
  const degraded    = nodes.filter((n) => n.health?.status === 'degraded').length;
  const unreachable = nodes.filter((n) => n.health?.status === 'unreachable').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <WidgetGrid>
        <Col8><NodeHealthListWidget nodes={nodes} /></Col8>
        <Col4>
          <div className="rounded-lg border bg-card p-6 space-y-3 h-full">
            <p className="text-sm font-semibold">Node Registry</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total nodes</span><span>{nodes.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Healthy</span><span className="text-green-600">{healthy}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Degraded</span><span className="text-amber-600">{degraded}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unreachable</span><span className="text-destructive">{unreachable}</span></div>
            </div>
          </div>
        </Col4>
      </WidgetGrid>
      <WidgetGrid>
        <Col6>
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold">Public Participation</p>
            {participation === null ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total submissions</span><span className="font-medium">{participation.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active notices</span><span className="font-medium">{participation.activeNotices}</span></div>
                <div className="pt-1 border-t space-y-1.5">
                  {Object.entries(participation.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{type}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col6>
        <Col6>
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold">Evidence</p>
            {evidence === null ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total items</span><span className="font-medium">{evidence.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">With weather context</span><span className="font-medium">{evidence.withWeatherContext}</span></div>
                <div className="pt-1 border-t space-y-1.5">
                  {Object.entries(evidence.byType).filter(([, c]) => c > 0).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{type}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col6>
      </WidgetGrid>
    </div>
  );
}
