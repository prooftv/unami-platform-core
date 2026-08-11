import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppearanceForm } from './_components/appearance-form';

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">Customise how UNCIP looks for you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theme &amp; Layout</CardTitle>
          <CardDescription>Preferences are saved to your browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceForm />
        </CardContent>
      </Card>
    </div>
  );
}
