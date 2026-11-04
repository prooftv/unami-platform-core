import { PageHeader } from '@unami/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function SpatialMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Geographic View"
        description="Cross-node governance activity mapped by municipality and ward."
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Map className="size-10 opacity-30" />
          <p className="text-sm">Geographic view available once ward boundary data is imported.</p>
          <p className="text-xs">Configure sources at Spatial → Data Sources.</p>
        </CardContent>
      </Card>
    </div>
  );
}
