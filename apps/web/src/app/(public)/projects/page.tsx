import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicApiClient } from '@/lib/api/client';

export const metadata: Metadata = {
  title: 'Community Projects',
  description: 'Active and completed community development projects in your area.',
};

const HEALTH_LABEL: Record<string, string> = {
  green: 'On Track', amber: 'At Risk', red: 'Critical',
};

const HEALTH_CLASS: Record<string, string> = {
  green: 'bg-green-500/10 text-green-700 dark:text-green-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  red:   'bg-red-500/10 text-red-700 dark:text-red-400',
};

const PHASE_LABEL: Record<string, string> = {
  planning: 'Planning', procurement: 'Procurement', construction: 'Construction',
  commissioning: 'Commissioning', operational: 'Operational',
};

export default async function ProjectsPage() {
  const api = getPublicApiClient();
  const result = await api.projects.list({ limit: 50 }).catch(() => null);
  const projects = result?.data ?? [];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Projects</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Development and infrastructure projects serving our communities — with live progress tracking and verified milestones.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No active community projects at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="font-semibold leading-snug">{project.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.content}</p>
                </div>
                {project.projectHealth && (
                  <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0 ${HEALTH_CLASS[project.projectHealth] ?? ''}`}>
                    {HEALTH_LABEL[project.projectHealth] ?? project.projectHealth}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {project.projectPhase && (
                  <span>{PHASE_LABEL[project.projectPhase] ?? project.projectPhase}</span>
                )}
                {project.beneficiaries != null && (
                  <span>{project.beneficiaries.toLocaleString()} beneficiaries</span>
                )}
                {project.targetRegions.length > 0 && (
                  <span>{project.targetRegions.join(', ')}</span>
                )}
                {project.sponsor && (
                  <span>Funded by {project.sponsor.displayName}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
