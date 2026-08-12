import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UNCIP_ROLE_LABELS } from '@/domain/uncip/types';
import type { UNCIPRole } from '@/domain/uncip/types';

const ROLES: UNCIPRole[] = ['parent', 'school', 'authority', 'community', 'admin'];

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getUNCIPSession();
  if (session?.role !== 'admin') redirect('/users');

  const client = await getUNCIPClient();
  const [stationsResult, schoolsResult] = await Promise.allSettled([
    client?.stations.list(),
    client?.schools.list(),
  ]);
  const stations = stationsResult.status === 'fulfilled' ? (stationsResult.value?.data ?? []) : [];
  const schools  = schoolsResult.status  === 'fulfilled' ? (schoolsResult.value?.data  ?? []) : [];

  const { error } = await searchParams;

  async function create(formData: FormData) {
    'use server';
    const supabase = createServiceClient();
    const email    = String(formData.get('email') ?? '').trim();
    const name     = String(formData.get('name') ?? '').trim() || null;
    const role     = formData.get('role') as UNCIPRole;
    const stationId = String(formData.get('stationId') ?? '').trim() || null;
    const schoolId  = String(formData.get('schoolId') ?? '').trim() || null;

    // Invite user via Supabase Auth (sends magic link)
    const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
    if (inviteError || !data.user) {
      redirect(`/users/new?error=${encodeURIComponent(inviteError?.message ?? 'Invite failed')}`);
    }

    // Create profile row
    const { error: profileError } = await supabase
      .from('uncip_user_profiles')
      .insert({
        id:         data.user.id,
        email,
        name,
        role,
        station_id: stationId,
        school_id:  schoolId,
        is_active:  true,
      });

    if (profileError) {
      redirect(`/users/new?error=${encodeURIComponent(profileError.message)}`);
    }

    redirect('/users');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite User"
        description="Send an invitation and assign a role."
        actions={
          <Button variant="outline" asChild>
            <Link href="/users">← Back</Link>
          </Button>
        }
      />
      <form action={create}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>User Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" required placeholder="user@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name (optional)</Label>
                  <Input id="name" name="name" placeholder="e.g. Thabo Nkosi" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{UNCIP_ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stationId">SAPS Station (authority / community)</Label>
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
                  <Label htmlFor="schoolId">School (school role only)</Label>
                  <Select name="schoolId">
                    <SelectTrigger id="schoolId"><SelectValue placeholder="Select school (optional)" /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild><Link href="/users">Cancel</Link></Button>
              <Button type="submit">Send Invitation</Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
                  <p>An invitation email will be sent to the user.</p>
                  <p>Authority and community users require a station assignment.</p>
                  <p>School users require a school assignment.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
