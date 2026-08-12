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

export default async function NewSchoolPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getUNCIPSession();
  if (session?.role !== 'admin') redirect('/schools');

  const client = await getUNCIPClient();
  const stationsRes = await client?.stations.list();
  const stations = stationsRes?.data ?? [];

  const { error } = await searchParams;

  async function create(formData: FormData) {
    'use server';
    const c = await getUNCIPClient();
    if (!c) redirect('/login');
    try {
      await c.schools.create({
        name:         String(formData.get('name') ?? '').trim(),
        province:     formData.get('province') as Province,
        address:      String(formData.get('address') ?? '').trim(),
        stationId:    String(formData.get('stationId') ?? '').trim() || null,
        emis:         String(formData.get('emis') ?? '').trim() || null,
        contactPhone: String(formData.get('contactPhone') ?? '').trim() || null,
        contactEmail: String(formData.get('contactEmail') ?? '').trim() || null,
      });
      redirect('/schools');
    } catch {
      redirect('/schools/new?error=Failed+to+create+school');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New School"
        description="Register a school in the UNCIP system."
        actions={
          <Button variant="outline" asChild>
            <Link href="/schools">← Back</Link>
          </Button>
        }
      />
      <form action={create}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">School Name</Label>
                  <Input id="name" name="name" required placeholder="e.g. Soweto Primary School" />
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
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" required placeholder="Street address" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stationId">SAPS Station Area</Label>
                  <Select name="stationId">
                    <SelectTrigger id="stationId"><SelectValue placeholder="Select station (optional)" /></SelectTrigger>
                    <SelectContent>
                      {stations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emis">EMIS Number (optional)</Label>
                  <Input id="emis" name="emis" placeholder="DBE EMIS number" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">Contact Phone (optional)</Label>
                  <Input id="contactPhone" name="contactPhone" type="tel" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" />
                </div>
                {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild><Link href="/schools">Cancel</Link></Button>
              <Button type="submit">Create School</Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
                  <p>Schools are assigned to a SAPS station area for alert scoping.</p>
                  <p>School staff users are linked to a specific school record.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
