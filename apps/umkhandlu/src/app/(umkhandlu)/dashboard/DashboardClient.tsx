'use client';

import { useState, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { DashboardTabs, type DashboardSection } from './DashboardTabs';
import {
  OverviewSection,
  NodesSection,
  GovernanceSection,
  CommercialSection,
  MemorySection,
  PlatformSection,
  KPIGridSkeleton,
  WidgetGridSkeleton,
  type OverviewProps,
  type NodesProps,
  type GovernanceProps,
  type CommercialProps,
  type MemoryProps,
  type PlatformProps,
} from './DashboardSections';

type DashboardClientProps = {
  operatorEmail: string;
  overview: OverviewProps;
  nodes: NodesProps;
  governance: GovernanceProps;
  commercial: CommercialProps;
  memory: MemoryProps;
  platform: PlatformProps;
};

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <KPIGridSkeleton columns={4} />
      <WidgetGridSkeleton cols={2} />
      <WidgetGridSkeleton cols={2} />
    </div>
  );
}

export function DashboardClient({
  operatorEmail,
  overview,
  nodes,
  governance,
  commercial,
  memory,
  platform,
}: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const sections: Record<DashboardSection, React.ReactNode> = {
    overview:   <OverviewSection {...overview} />,
    nodes:      <NodesSection {...nodes} />,
    governance: <GovernanceSection {...governance} />,
    commercial: <CommercialSection {...commercial} />,
    memory:     <MemorySection {...memory} />,
    platform:   <PlatformSection {...platform} />,
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-end justify-between px-4 pt-6 pb-3 lg:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Unami Control Centre</h1>
              <Badge variant="outline">Read-only</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{operatorEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent mb-3"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>
        <DashboardTabs active={activeSection} onChange={setActiveSection} />
      </div>
      <div className="p-4 lg:p-6">
        <Suspense fallback={<SectionSkeleton />}>
          {sections[activeSection]}
        </Suspense>
      </div>
    </div>
  );
}
