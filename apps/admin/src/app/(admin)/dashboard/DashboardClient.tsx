'use client';

import { useState, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import type { AdminSession } from '@unami/api';
import { RefreshCw } from 'lucide-react';
import { DashboardTabs, type DashboardSection } from './DashboardTabs';
import {
  OverviewSection, OperationsSection, PublishingSection, AudienceSection,
  GovernanceSection, CommercialSection, PlatformSection,
  KPIGridSkeleton, WidgetGridSkeleton,
  type OverviewProps, type OperationsProps, type PublishingProps,
  type AudienceProps, type GovernanceProps, type CommercialProps, type PlatformProps,
} from './DashboardSections';

const ROLE_LABELS: Record<AdminSession['role'], string> = {
  superadmin: 'Super Admin',
  content_admin: 'Content Admin',
  moderator: 'Moderator',
  viewer: 'Viewer',
};

type DashboardClientProps = {
  session: AdminSession;
  overview: OverviewProps;
  operations: OperationsProps;
  publishing: PublishingProps;
  audience: AudienceProps;
  governance: GovernanceProps;
  commercial: CommercialProps;
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

export function DashboardClient({ session, overview, operations, publishing, audience, governance, commercial, platform }: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  const sections: Record<DashboardSection, React.ReactNode> = {
    overview:   <OverviewSection {...overview} />,
    operations: <OperationsSection {...operations} />,
    publishing: <PublishingSection {...publishing} />,
    audience:   <AudienceSection {...audience} />,
    governance: <GovernanceSection {...governance} />,
    commercial: <CommercialSection {...commercial} />,
    platform:   <PlatformSection {...platform} />,
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-end justify-between px-4 pt-6 pb-3 lg:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Moments Command Centre</h1>
              <Badge variant="default">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {session.name ?? session.email} · {ROLE_LABELS[session.role]}
            </p>
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
