import { PageHeader } from '@unami/ui';
import { fetchAggregatedLineage, fetchAggregatedEvidence } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Link2, FileCheck, Image, FileText } from 'lucide-react';

export default async function AuditTrailsPage() {
  const [lineage, evidence] = await Promise.all([
    fetchAggregatedLineage(),
    fetchAggregatedEvidence(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trails"
        description="Institutional memory — lineage chains, provenance, and evidence across all nodes"
      />

      {/* Lineage KPIs */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl sm:grid-cols-4">
        {[
          { label: 'Root Records',    value: lineage?.rootRecords ?? 0,   icon: BookOpen },
          { label: 'Linked Records',  value: lineage?.linkedRecords ?? 0, icon: Link2 },
          { label: 'Lineage Certs',   value: lineage?.layer5Outputs.lineageCertificates ?? 0, icon: FileCheck },
          { label: 'Journey Maps',    value: lineage?.layer5Outputs.journeyMaps ?? 0,         icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Lineage breakdown */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Record Lineage</CardTitle>
                <CardDescription className="text-xs mt-0.5">Chain depth and provenance coverage</CardDescription>
              </div>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {lineage === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              [
                { label: 'Root records (no parent)',  value: lineage.rootRecords },
                { label: 'Linked records (in chain)', value: lineage.linkedRecords },
                { label: 'Total records',             value: lineage.rootRecords + lineage.linkedRecords },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Layer 5 outputs */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Layer 5 Outputs</CardTitle>
                <CardDescription className="text-xs mt-0.5">Derived institutional memory documents</CardDescription>
              </div>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {lineage === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              [
                { label: 'Lineage certificates', value: lineage.layer5Outputs.lineageCertificates },
                { label: 'Proof of publication', value: lineage.layer5Outputs.proofOfPublication },
                { label: 'Journey maps',          value: lineage.layer5Outputs.journeyMaps },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Evidence summary */}
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Evidence</CardTitle>
                <CardDescription className="text-xs mt-0.5">Attachments and environmental context</CardDescription>
              </div>
              <Image className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {evidence === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              [
                { label: 'Total evidence items',      value: evidence.total },
                { label: 'With weather context',      value: evidence.withWeatherContext },
                ...Object.entries(evidence.byType)
                  .filter(([, count]) => count > 0)
                  .map(([type, count]) => ({ label: type, value: count })),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{label}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
