import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUNCIPClient, getUNCIPSession } from '@/lib/auth/operator';
import { createServiceClient } from '@/lib/supabase/server';
import { PROVINCE_LABELS, CHILD_GENDER_LABELS } from '@/domain/uncip/types';
import type { Province, ChildGender } from '@/domain/uncip/types';

export default async function NewChildPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getUNCIPSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'parent') redirect('/children');
  const client = await getUNCIPClient();
  const schools = await client?.schools.list().then((r) => r.data).catch(() => []) ?? [];

  const { error } = await searchParams;

  async function create(formData: FormData) {
    'use server';
    const c = await getUNCIPClient();
    if (!c) redirect('/login');

    // Handle optional photo upload
    let photoUrl: string | null = null;
    const photoFile = formData.get('photo');
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        const svc = createServiceClient();
        const ext  = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await svc.storage
          .from('children-photos')
          .upload(path, await photoFile.arrayBuffer(), {
            contentType: photoFile.type,
            upsert: false,
          });
        if (!uploadError) {
          const { data: urlData } = svc.storage.from('children-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      } catch {
        // Photo upload failure is non-fatal — child is registered without photo
      }
    }

    try {
      const res = await c.children.create({
        firstName:            String(formData.get('firstName') ?? '').trim(),
        lastName:             String(formData.get('lastName') ?? '').trim(),
        dateOfBirth:          String(formData.get('dateOfBirth') ?? '').trim(),
        gender:               formData.get('gender') as ChildGender,
        photoUrl,
        identificationNumber: String(formData.get('identificationNumber') ?? '').trim() || null,
        schoolId:             String(formData.get('schoolId') ?? '').trim() || null,
        addressStreet:        String(formData.get('addressStreet') ?? '').trim() || null,
        addressCity:          String(formData.get('addressCity') ?? '').trim() || null,
        addressProvince:      (formData.get('addressProvince') as Province) || null,
        addressPostalCode:    String(formData.get('addressPostalCode') ?? '').trim() || null,
      });
      redirect(`/children/${res.data.id}`);
    } catch {
      redirect('/children/new?error=Failed+to+register+child');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Child"
        description="Add a child to the UNCIP identification system."
        actions={
          <Button variant="outline" asChild>
            <Link href="/children">← Back</Link>
          </Button>
        }
      />
      <form action={create} encType="multipart/form-data">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">

            <Card>
              <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender" required>
                      <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(CHILD_GENDER_LABELS) as [ChildGender, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="identificationNumber">SA ID / Birth Certificate Number (optional)</Label>
                  <Input id="identificationNumber" name="identificationNumber" placeholder="Required before raising a missing-child alert" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="photo">Photo (optional)</Label>
                  <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
                  <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>School (optional)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label htmlFor="schoolId">School</Label>
                  <Select name="schoolId">
                    <SelectTrigger id="schoolId"><SelectValue placeholder="Select school" /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Address (optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="addressStreet">Street</Label>
                  <Input id="addressStreet" name="addressStreet" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="addressCity">City</Label>
                    <Input id="addressCity" name="addressCity" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="addressPostalCode">Postal Code</Label>
                    <Input id="addressPostalCode" name="addressPostalCode" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressProvince">Province</Label>
                  <Select name="addressProvince">
                    <SelectTrigger id="addressProvince"><SelectValue placeholder="Select province" /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PROVINCE_LABELS) as [Province, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-sm text-destructive">{decodeURIComponent(error)}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild><Link href="/children">Cancel</Link></Button>
              <Button type="submit">Register Child</Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-2">
                  <p>The ID number is optional at registration but required before raising a missing-child alert.</p>
                  <p>A photo helps identify the child quickly in an emergency.</p>
                  <p>You will be linked as the primary guardian automatically.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
