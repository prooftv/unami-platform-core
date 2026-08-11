import { Card, CardContent } from '@/components/ui/card';
import { APP_CONFIG } from '@/config/app-config';

const INFO = [
  { label: 'Application',  value: 'UNCIP v2' },
  { label: 'Phase',        value: 'Foundation — UI Shell' },
  { label: 'Platform',     value: 'Unami Platform Core' },
  { label: 'Auth',         value: 'Mock (foundation phase)' },
];

export default function PlatformPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Platform</h2>
        <p className="text-sm text-muted-foreground">{APP_CONFIG.name} version and environment.</p>
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
