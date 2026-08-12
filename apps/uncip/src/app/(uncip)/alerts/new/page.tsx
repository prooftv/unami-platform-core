import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUNCIPClient, getUNCIPSession } from '@/lib/auth/operator';
import { ALERT_TYPE_LABELS } from '@/domain/uncip/types';
import type { AlertType } from '@/domain/uncip/types';

const ALERT_TYPES: AlertType[] = ['missing', 'medical', 'danger', 'other'];

export default async function NewAlertPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string; error?: string }>;
}) {
  const session = await getUNCIPSession();
  if (!session) redirect('/login');
  if (!['admin', 'parent', 'school'].includes(session.role)) redirect('/alerts');
  const { childId, error } = await searchParams;
  const client = await getUNCIPClient();

  const [childrenRes, preselectedRes] = await Promise.allSettled([
    client?.children.list({ limit: 100 }),
    childId ? client?.children.get(childId) : Promise.resolve(null),
  ]);

  const children    = childrenRes.status    === 'fulfilled' ? (childrenRes.value?.data    ?? []) : [];
  const preselected = preselectedRes.status === 'fulfilled' ? (preselectedRes.value?.data ?? null) : null;

  async function create(formData: FormData) {
    'use server';
    const c = await getUNCIPClient();
    if (!c) redirect('/login');
    try {
      const res = await c.alerts.create({
        childId:          String(formData.get('childId') ?? '').trim(),
        alertType:        formData.get('alertType') as AlertType,
        description:      String(formData.get('description') ?? '').trim(),
        lastSeenAt:       String(formData.get('lastSeenAt') ?? '').trim(),
        lastSeenLocation: String(formData.get('lastSeenLocation') ?? '').trim(),
        lastSeenWearing:  String(formData.get('lastSeenWearing') ?? '').trim() || null,
        contactPhone:     String(formData.get('contactPhone') ?? '').trim(),
      });
      redirect(`/alerts/${res.data.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create alert';
      redirect(`/alerts/new?error=${encodeURIComponent(msg)}${childId ? `&childId=${childId}` : ''}`);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raise Alert"
        description="Create a missing child or emergency alert."
        actions={
          <Button variant="outline" asChild>
            <Link href={preselected ? `/children/${preselected.id}` : '/alerts'}>← Back</Link>
          </Button>
        }
      />
      <form action={create}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">

            <Card>
              <CardHeader><CardTitle>Alert Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="childId">Child</Label>
                  <Select name="childId" required defaultValue={preselected?.id}>
                    <SelectTrigger id="childId"><SelectValue placeholder="Select child" /></SelectTrigger>
                    <SelectContent>
                      {children.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="alertType">Alert Type</Label>
                  <Select name="alertType" required>
                    <SelectTrigger id="alertType"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {ALERT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{ALERT_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required rows={3} placeholder="Describe the situation" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input id="contactPhone" name="contactPhone" type="tel" required placeholder="+27 82 000 0000" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Last Seen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="lastSeenAt">Date &amp; Time Last Seen</Label>
                  <Input id="lastSeenAt" name="lastSeenAt" type="datetime-local" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastSeenLocation">Location</Label>
                  <Input id="lastSeenLocation" name="lastSeenLocation" required placeholder="e.g. Near Soweto Primary School" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastSeenWearing">Wearing (optional)</Label>
                  <Input id="lastSeenWearing" name="lastSeenWearing" placeholder="e.g. Blue school uniform" />
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={preselected ? `/children/${preselected.id}` : '/alerts'}>Cancel</Link>
              </Button>
              <Button type="submit">Raise Alert</Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
                  <p>A missing-child alert requires the child to have an ID number on record.</p>
                  <p>The alert will be scoped to the child&apos;s registered SAPS station area.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
