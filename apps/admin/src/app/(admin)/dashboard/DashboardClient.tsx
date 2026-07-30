'use client';

import { useState, Suspense } from 'react';
import { ContentLayout, PageHeader } from '@moments/ui';
import type { AdminSession } from '@moments/api';
import { DashboardTabs, type DashboardSection } from './DashboardTabs';
import {
  OverviewSection,
  OperationsSection,
  PublishingSection,
  AudienceSection,
  GovernanceSection,
  CommercialSection,
  PlatformSection,
  KPIGridSkeleton,
  WidgetGridSkeleton,
  type OverviewProps,
  type OperationsProps,
  type PublishingProps,
  type AudienceProps,
  type GovernanceProps,
  type CommercialProps,
  type PlatformProps,
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
    <div className="space-y-4">
      <KPIGridSkeleton columns={4} />
      <WidgetGridSkeleton cols={2} />
      <WidgetGridSkeleton cols={2} />
    </div>
  );
}

export function DashboardClient({
  session,
  overview,
  operations,
  publishing,
  audience,
  governance,
  commercial,
  platform,
}: DashboardClientProps) {
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
      <div className="sticky top-0 z-10 bg-background">
        <ContentLayout className="py-0 pb-0">
          <PageHeader
            title="Dashboard"
            description={`${session.name ?? session.email} · ${ROLE_LABELS[session.role]}`}
            className="pt-6 pb-4"
          />
        </ContentLayout>
        <DashboardTabs active={activeSection} onChange={setActiveSection} />
      </div>
      <ContentLayout>
        <Suspense fallback={<SectionSkeleton />}>
          {sections[activeSection]}
        </Suspense>
      </ContentLayout>
    </div>
  );
}
