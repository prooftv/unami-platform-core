'use client';

import { useState, Suspense } from 'react';
import { ContentLayout, Badge } from '@moments/ui';
import type { AdminSession } from '@moments/api';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { DashboardTabs, type DashboardSection } from './DashboardTabs';
import { OverviewSection, OperationsSection, PublishingSection, AudienceSection, GovernanceSection, CommercialSection, PlatformSection, KPIGridSkeleton, WidgetGridSkeleton, type OverviewProps, type OperationsProps, type PublishingProps, type AudienceProps, type GovernanceProps, type CommercialProps, type PlatformProps } from './DashboardSections';

const ROLE_LABELS: Record<AdminSession['role'], string> = { superadmin: 'Super Admin', content_admin: 'Content Admin', moderator: 'Moderator', viewer: 'Viewer' };
type DashboardClientProps = { session: AdminSession; overview: OverviewProps; operations: OperationsProps; publishing: PublishingProps; audience: AudienceProps; governance: GovernanceProps; commercial: CommercialProps; platform: PlatformProps };
function SectionSkeleton() { return <div className="flex flex-col gap-4"><KPIGridSkeleton columns={4} /><WidgetGridSkeleton cols={2} /><WidgetGridSkeleton cols={2} /></div>; }

export function DashboardClient({ session, overview, operations, publishing, audience, governance, commercial, platform }: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const sections: Record<DashboardSection, React.ReactNode> = { overview: <OverviewSection {...overview} />, operations: <OperationsSection {...operations} />, publishing: <PublishingSection {...publishing} />, audience: <AudienceSection {...audience} />, governance: <GovernanceSection {...governance} />, commercial: <CommercialSection {...commercial} />, platform: <PlatformSection {...platform} /> };
  return (
    <ContentLayout className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2"><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Operations overview</h1><Badge variant="success">Live</Badge></div><p className="text-sm text-muted-foreground">Monitor publishing, audience, governance, and platform health from one workspace.</p></div>
        <div className="flex items-center gap-2"><button type="button" className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"><CalendarDays className="size-4" />Last 30 days</button><button type="button" onClick={() => window.location.reload()} className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"><RefreshCw className="size-4" />Refresh</button></div>
      </div>
      <div className="flex flex-col gap-2"><DashboardTabs active={activeSection} onChange={setActiveSection} /><p className="text-xs text-muted-foreground">Signed in as {session.name ?? session.email} · {ROLE_LABELS[session.role]}</p></div>
      <Suspense fallback={<SectionSkeleton />}>{sections[activeSection]}</Suspense>
    </ContentLayout>
  );
}
