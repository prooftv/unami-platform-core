import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const api = getPublicApiClient();
  const res = await api.projects.get(id).catch(() => null);
  if (!res) return { title: 'Project not found' };
  return { title: res.data.title, description: res.data.content.slice(0, 160) };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const api = getPublicApiClient();
  const res = await api.projects.get(id).catch(() => null);
  if (!res) notFound();

  const project = res.data;
  const certifiedCount = Array.isArray(project.progressLog)
    ? project.progressLog.length
    : 0;

  return (
    <article className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/projects" className="hover:text-foreground transition-colors">
            ← Community Projects
          </Link>
          {project.projectPhase && (
            <>
              <span>·</span>
              <span>{PHASE_LABEL[project.projectPhase] ?? project.projectPhase}</span>
            </>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{project.title}</h1>
          {project.projectHealth && (
            <span className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 mt-0.5 ${HEALTH_CLASS[project.projectHealth] ?? ''}`}>
              {HEALTH_LABEL[project.projectHealth] ?? project.projectHealth}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {project.targetRegions.length > 0 && <span>{project.targetRegions.join(', ')}</span>}
          {project.beneficiaries != null && (
            <span>{project.beneficiaries.toLocaleString()} community members</span>
          )}
          {project.sponsor && <span>Funded by {project.sponsor.displayName}</span>}
          {project.projectReference && <span>Ref: {project.projectReference}</span>}
        </div>
      </div>

      {/* Project overview */}
      <div className="prose prose-sm max-w-none text-foreground">
        {project.content.split('\n').map((line, i) => (
          <p key={i} className="mb-3 last:mb-0 leading-relaxed">{line}</p>
        ))}
      </div>

      {/* Key facts */}
      {(project.fundingSource || project.contractor) && (
        <div className="rounded-xl border bg-muted/30 px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          {project.fundingSource && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Funding Source</p>
              <p className="font-medium">{project.fundingSource}</p>
            </div>
          )}
          {project.contractor && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Contractor</p>
              <p className="font-medium">{project.contractor}</p>
            </div>
          )}
        </div>
      )}

      {/* Progress log */}
      {Array.isArray(project.progressLog) && project.progressLog.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Project Updates
          </p>
          <ol className="space-y-3">
            {[...project.progressLog].reverse().map((entry, i) => (
              <li key={i} className="rounded-md border px-4 py-3">
                <p className="text-sm leading-relaxed">{entry.update}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {new Date(entry.date).toLocaleDateString('en-ZA', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Impact summary — shown when project is complete */}
      {project.impactSummary && (
        <div className="rounded-xl border bg-muted/30 px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Community Impact</p>
          <p className="text-sm leading-relaxed">{project.impactSummary}</p>
        </div>
      )}

      {/* Media */}
      {project.mediaUrls && project.mediaUrls.length > 0 && (
        <div className="space-y-3">
          {project.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg w-full object-cover max-h-96" />
          ))}
        </div>
      )}

      <div className="pt-2 border-t">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← All community projects
        </Link>
      </div>
    </article>
  );
}
