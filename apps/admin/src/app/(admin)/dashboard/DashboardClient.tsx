'use client';

import { useState } from 'react';
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
} from './DashboardSections';

const ROLE_LABELS: Record<AdminSession['role'], string> = {
  superadmin: 'Super Admin',
  content_admin: 'Content Admin',
  moderator: 'Moderator',
  viewer: 'Viewer',
};

const SECTION_MAP: Record<DashboardSection, React.ReactNode> = {
  overview: <OverviewSection />,
  operations: <OperationsSection />,
  publishing: <PublishingSection />,
  audience: <AudienceSection />,
  governance: <GovernanceSection />,
  commercial: <CommercialSection />,
  platform: <PlatformSection />,
};

export function DashboardClient({ session }: { session: AdminSession }) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky section tabs below header */}
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

      {/* Section content */}
      <ContentLayout>
        {SECTION_MAP[activeSection]}
      </ContentLayout>
    </div>
  );
}
