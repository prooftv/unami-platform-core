'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ScrollText, AlertOctagon, Link2 } from 'lucide-react';
import type { LineageSummary, TcrsSummary } from '@unami/api';

// ── Memory KPIs ───────────────────────────────────────────────────────────────

export function MemoryKPIs({
  lineage,
  tcrs,
}: {
  lineage: LineageSummary | null;
  tcrs: TcrsSummary | null;
}) {
  const kpis = [
    { title: 'Linked Records',      value: lineage?.linkedRecords ?? '—',                    description: 'records with provenance chain',    icon: Link2 },
    { title: 'Root Records',        value: lineage?.rootRecords ?? '—',                      description: 'records with no parent',           icon: GitBranch },
    { title: 'Layer 5 Outputs',     value: lineage ? Object.values(lineage.layer5Outputs).reduce((a, b) => a + b, 0) : '—', description: 'certificates + proofs + maps', icon: ScrollText },
    { title: 'Escalated Conflicts', value: tcrs?.escalated ?? '—',                           description: `${tcrs?.total ?? 0} total logged`, icon: AlertOctagon },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map(({ title, value, description, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Layer 5 Outputs Widget ────────────────────────────────────────────────────

export function Layer5OutputsWidget({ summary }: { summary: LineageSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Layer 5 Outputs</CardTitle>
          <CardDescription className="text-xs mt-0.5">Institutional memory artefacts</CardDescription>
        </div>
        <ScrollText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lineage Certificates</span>
              <Badge variant="outline">{summary.layer5Outputs.lineageCertificates}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Proof of Publication</span>
              <Badge variant="outline">{summary.layer5Outputs.proofOfPublication}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Journey Maps</span>
              <Badge variant="outline">{summary.layer5Outputs.journeyMaps}</Badge>
            </div>
            {summary.averageChainDepth !== undefined && (
              <div className="flex items-center justify-between text-sm pt-1 border-t">
                <span className="text-muted-foreground">Avg. chain depth</span>
                <span className="text-sm font-medium">{summary.averageChainDepth.toFixed(1)}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── TCRS Summary Widget ───────────────────────────────────────────────────────

export function TcrsSummaryWidget({ summary }: { summary: TcrsSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Conflict Resolution</CardTitle>
          <CardDescription className="text-xs mt-0.5">TCRS conflict log summary</CardDescription>
        </div>
        <AlertOctagon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <>
            {Object.entries(summary.byResolutionState).map(([state, count]) => (
              <div key={state} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{state}</span>
                <Badge variant={state === 'escalated' ? 'destructive' : 'outline'}>{count}</Badge>
              </div>
            ))}
            {summary.averageResolutionDays !== undefined && (
              <div className="flex items-center justify-between text-sm pt-1 border-t">
                <span className="text-muted-foreground">Avg. resolution</span>
                <span className="text-sm font-medium">{summary.averageResolutionDays.toFixed(1)} days</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Lineage Coverage Widget ───────────────────────────────────────────────────

export function LineageCoverageWidget({ summary }: { summary: LineageSummary | null }) {
  const total   = summary ? summary.rootRecords + summary.linkedRecords : 0;
  const pct     = total > 0 ? Math.round((summary!.linkedRecords / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Lineage Coverage</CardTitle>
          <CardDescription className="text-xs mt-0.5">Records with provenance chains</CardDescription>
        </div>
        <GitBranch className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Linked records</span>
              <Badge variant="default">{summary.linkedRecords}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Root records</span>
              <Badge variant="outline">{summary.rootRecords}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t">
              <span className="text-muted-foreground">Coverage</span>
              <span className="text-sm font-medium">{pct}%</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
