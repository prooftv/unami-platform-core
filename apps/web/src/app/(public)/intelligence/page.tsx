import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicApiClient } from '@/lib/api/client';

export const metadata: Metadata = {
  title: 'Community Intelligence',
  description: 'Live community activity, project health, and participation trends across South Africa.',
};

const HEALTH_CLASS: Record<string, string> = {
  green: 'bg-green-500/10 text-green-700 dark:text-green-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  red:   'bg-red-500/10 text-red-700 dark:text-red-400',
};
const HEALTH_LABEL: Record<string, string> = {
  green: 'On Track', amber: 'At Risk', red: 'Critical',
};

export default async function IntelligencePage() {
  const api = getPublicApiClient();

  const [momentsResult, projectsResult] = await Promise.all([
    api.moments.list({ limit: 6 }).catch(() => null),
    api.projects.list({ limit: 50 }).catch(() => null),
  ]);

  const moments   = momentsResult?.data ?? [];
  const projects  = projectsResult?.data ?? [];
  const totalMoments   = momentsResult?.pagination?.total ?? 0;
  const totalProjects  = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const totalBeneficiaries = projects.reduce((sum, p) => sum + (p.beneficiaries ?? 0), 0);

  const healthCounts = projects.reduce<Record<string, number>>((acc, p) => {
    if (p.projectHealth) acc[p.projectHealth] = (acc[p.projectHealth] ?? 0) + 1;
    return acc;
  }, {});

  const TYPE_LABELS: Record<string, string> = {
    standard: 'Standard', community: 'Community Notice',
    opportunity: 'Opportunity', infrastructure: 'Infrastructure Update',
    consultation: 'Public Consultation',
  };

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Intelligence</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Live signals from community activity across South Africa — moments, projects, and participation.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Moments', value: totalMoments.toLocaleString() },
          { label: 'Community Projects', value: totalProjects.toLocaleString() },
          { label: 'Active Projects', value: activeProjects.toLocaleString() },
          { label: 'Beneficiaries', value: totalBeneficiaries.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Project health distribution */}
      {Object.keys(healthCounts).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Health</p>
          <div className="flex flex-wrap gap-3">
            {(['green', 'amber', 'red'] as const).map((h) =>
              healthCounts[h] ? (
                <Link
                  key={h}
                  href={`/projects?health=${h}`}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 ${HEALTH_CLASS[h]}`}
                >
                  {HEALTH_LABEL[h]} · {healthCounts[h]}
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Recent moments */}
      {moments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent Moments</p>
            <Link href="/feed" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <ul className="space-y-2">
            {moments.map((moment) => (
              <li key={moment.id}>
                <Link
                  href={`/moments/${moment.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{moment.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {moment.region} · {TYPE_LABELS[moment.momentType ?? 'standard'] ?? moment.momentType}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {new Date(moment.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Active projects */}
      {projects.filter((p) => p.status === 'active').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Projects</p>
            <Link href="/projects" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <ul className="space-y-2">
            {projects.filter((p) => p.status === 'active').slice(0, 5).map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {project.targetRegions.join(', ')}
                      {project.beneficiaries != null && ` · ${project.beneficiaries.toLocaleString()} beneficiaries`}
                    </p>
                  </div>
                  {project.projectHealth && (
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 shrink-0 ${HEALTH_CLASS[project.projectHealth] ?? ''}`}>
                      {HEALTH_LABEL[project.projectHealth]}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
