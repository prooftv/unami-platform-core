import { Card, CardContent } from '@/components/ui/card';

const INFO = [
  { label: 'Application',       value: 'Unami Control Centre' },
  { label: 'Phase',             value: '18D — Cross-Node Aggregation' },
  { label: 'Node API Contract', value: 'v1.0' },
  { label: 'Supabase Project',  value: 'ufsmpqxniswdnsywjzje' },
];

export default function PlatformPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Platform</h2>
        <p className="text-sm text-muted-foreground">Control Centre version and environment</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-3">
          {INFO.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-xs font-medium">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
