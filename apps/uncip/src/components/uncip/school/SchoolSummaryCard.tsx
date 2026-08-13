import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PROVINCE_LABELS } from '@/domain/uncip/types';
import type { UNCIPSchool } from '@unami/api';

export function SchoolSummaryCard({ school }: { school: UNCIPSchool }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="font-medium text-sm">{school.name}</p>
        <p className="text-xs text-muted-foreground">{school.address}</p>
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <Badge variant="outline" className="text-xs capitalize">
            {PROVINCE_LABELS[school.province] ?? school.province}
          </Badge>
          {school.contactPhone && (
            <span className="text-xs text-muted-foreground">{school.contactPhone}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
