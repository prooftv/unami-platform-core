import { Card, CardContent } from '@/components/ui/card';
import { PROVINCE_LABELS, type SAPSStation } from '@/domain/uncip/types';

export function StationSummaryCard({ station }: { station: SAPSStation }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-medium">{station.name}</p>
        <p className="text-sm text-muted-foreground">
          {PROVINCE_LABELS[station.province]}
          {station.district && ` · ${station.district}`}
        </p>
        {station.contactPhone && (
          <p className="text-sm text-muted-foreground">{station.contactPhone}</p>
        )}
      </CardContent>
    </Card>
  );
}
