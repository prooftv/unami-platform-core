import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Control Centre operator preferences"
      />
      <div className="max-w-2xl">
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Operator Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Settings configuration — Phase 19.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
