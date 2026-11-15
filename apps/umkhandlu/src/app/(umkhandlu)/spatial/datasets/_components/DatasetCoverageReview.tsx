'use client';

import { useState } from 'react';
import { AlertTriangle, LoaderCircle, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyseDatasetCoverageAction, type DatasetCoverageReport } from '../../coverage-actions';

export function DatasetCoverageReview({ datasetId }: { datasetId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DatasetCoverageReport | null>(null);

  async function analyse() {
    setPending(true);
    setError(null);
    setReport(null);
    try {
      const result = await analyseDatasetCoverageAction(datasetId);
      if ('error' in result) {
        setError(result.error);
      } else {
        setReport(result.report);
      }
    } catch {
      setError('Coverage review could not be completed. No records were changed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compare stored point features with the uniquely identified, published MDB Amajuba DC25
        district polygon. This operator-only review is read-only and does not change dataset
        records or permissions.
      </p>
      <Button type="button" variant="outline" onClick={analyse} disabled={pending}>
        {pending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <ScanSearch className="mr-2 size-4" />}
        {pending ? 'Reviewing coverage…' : 'Run point coverage review'}
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {report && (
        <div className="space-y-4" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Records retrieved" value={report.inventory.retrieved} />
            <Metric label="Point features evaluated" value={report.inventory.evaluatedPoints} />
            <Metric label="Inside reference polygon" value={report.inventory.inside} />
            <Metric
              label="Outside polygon — review"
              value={report.inventory.outside}
              warning={report.inventory.outside > 0}
            />
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">Dataset being reviewed</p>
            <p>{report.dataset.name} ({report.dataset.id})</p>
            <p className="text-muted-foreground">
              Source: {report.dataset.sourceInstitution ?? report.dataset.sourceName ?? 'not recorded'}
              {report.dataset.sourceId ? ` · ${report.dataset.sourceId}` : ''}
              {report.dataset.vintage ? ` · vintage ${report.dataset.vintage}` : ''}
            </p>
            <p className="text-muted-foreground">
              Permissions: dataset {report.dataset.datasetPermission ?? 'not recorded'}; source{' '}
              {report.dataset.sourcePermission ?? 'not recorded'}
            </p>
            <p className="text-muted-foreground">
              Attribution: {report.dataset.attribution ?? 'not recorded'}
            </p>
            <p className="text-muted-foreground">
              Dataset licence: {report.dataset.datasetLicenseTerms ?? 'not recorded'}; source licence:{' '}
              {report.dataset.sourceLicenseTerms ?? 'not recorded'}
            </p>
          </div>
          <div
            className={`rounded-md border p-3 text-sm ${
              report.boundary.authoritativeStatusVerified
                ? ''
                : 'border-amber-500 bg-amber-50 text-amber-950'
            }`}
          >
            <p className="font-medium">Reference boundary used</p>
            <p>{report.boundary.datasetName} ({report.boundary.datasetId})</p>
            <p className="text-muted-foreground">
              Feature {report.boundary.featureId} ·{' '}
              {report.boundary.sourceInstitution ?? report.boundary.sourceName ?? 'Source not recorded'}
              {report.boundary.vintage ? ` · vintage ${report.boundary.vintage}` : ''}
              {' · source authority: '}
              {report.boundary.sourceAuthorityStatus ?? 'not recorded'}
            </p>
            <p className="text-muted-foreground">
              Permissions: dataset {report.boundary.datasetPermission ?? 'not recorded'}; source{' '}
              {report.boundary.sourcePermission ?? 'not recorded'}
            </p>
            <p className="text-muted-foreground">
              Dataset licence: {report.boundary.datasetLicenseTerms ?? 'not recorded'}; source licence:{' '}
              {report.boundary.sourceLicenseTerms ?? 'not recorded'}
            </p>
            {!report.boundary.authoritativeStatusVerified && (
              <p className="mt-2 font-medium">
                Control Centre does not classify this source as authoritative. Counts are geometric
                comparison evidence only.
              </p>
            )}
          </div>

          {(report.inventory.invalidGeometry > 0 || report.inventory.nonPointGeometry > 0) && (
            <p className="text-sm text-amber-800">
              Invalid geometries: {report.inventory.invalidGeometry}; non-point geometries not evaluated:
              {' '}{report.inventory.nonPointGeometry}.
            </p>
          )}

          {report.inventory.outside > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4 text-amber-600" />
                Outside-boundary records requiring scope review
              </h3>
              <div className="max-h-80 overflow-auto rounded-md border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th scope="col" className="p-2">Staging feature ID</th>
                      <th scope="col" className="p-2">Label</th>
                      <th scope="col" className="p-2">Longitude, latitude</th>
                      <th scope="col" className="p-2">Operator status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.outsideFeatures.map((feature) => (
                      <tr key={feature.stagingFeatureId} className="border-t">
                        <td className="p-2 font-mono">{feature.stagingFeatureId}</td>
                        <td className="p-2">{feature.label}</td>
                        <td className="p-2 font-mono">{feature.longitude}, {feature.latitude}</td>
                        <td className="p-2">{feature.operatorStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {report.outsideFeaturesTruncated && (
                <p className="text-xs text-muted-foreground">
                  Showing the first {report.outsideFeatures.length} of {report.inventory.outside} outside-boundary records.
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">{report.note}</p>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className={`text-xl font-semibold ${warning ? 'text-amber-700' : ''}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
