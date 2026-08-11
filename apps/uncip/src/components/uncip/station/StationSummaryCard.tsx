import { Card, CardContent } from '@/components/ui/card';
import { PROVINCE_LABELS } from '@/domain/uncip/types';
import type { UNCIPStation } from '@unami/api';

export function StationSummaryCard({ station }: { station: UNCIPStation }) {
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
