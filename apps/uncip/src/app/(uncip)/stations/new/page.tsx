import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PROVINCE_LABELS } from '@/domain/uncip/types';
import type { Province } from '@/domain/uncip/types';

export default async function NewStationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getUNCIPSession();
  if (session?.role !== 'admin') redirect('/stations');

  const { error } = await searchParams;

  async function create(formData: FormData) {
    'use server';
    const client = await getUNCIPClient();
    if (!client) redirect('/login');
    try {
      await client.stations.create({
        name:         String(formData.get('name') ?? '').trim(),
        province:     formData.get('province') as Province,
        district:     String(formData.get('district') ?? '').trim() || null,
        contactPhone: String(formData.get('contactPhone') ?? '').trim() || null,
      });
      redirect('/stations');
    } catch {
      redirect('/stations/new?error=Failed+to+create+station');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New SAPS Station"
        description="Add a station area for alert scoping and user assignment."
        actions={
          <Button variant="outline" asChild>
            <Link href="/stations">← Back</Link>
          </Button>
        }
      />
      <form action={create}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Station Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Station Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Soweto SAPS" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="province">Province</Label>
                  <Select name="province" required>
                    <SelectTrigger id="province"><SelectValue placeholder="Select province" /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PROVINCE_LABELS) as [Province, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="district">District (optional)</Label>
                  <Input id="district" name="district" placeholder="e.g. Johannesburg Metro" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
                  <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+27 11 000 0000" />
                </div>
                {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild><Link href="/stations">Cancel</Link></Button>
              <Button type="submit">Create Station</Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
                  <p>Stations define the geographic scope for alerts and user assignments.</p>
                  <p>Authority and community users are assigned to a station area.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
