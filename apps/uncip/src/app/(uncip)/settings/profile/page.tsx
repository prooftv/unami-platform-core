import { getUNCIPSession } from '@/lib/auth/operator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UNCIP_ROLE_LABELS } from '@/domain/uncip';

export default async function ProfilePage() {
  const session = await getUNCIPSession();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
          <CardDescription>Your identity in the UNCIP system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={session?.email ?? ''} disabled className="bg-muted" readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" defaultValue={session?.name ?? ''} placeholder="Your name" disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <div>
              <Badge variant="secondary" className="capitalize">
                {session?.role ? (UNCIP_ROLE_LABELS[session.role] ?? session.role) : 'Unknown'}
              </Badge>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile editing will be available once authentication is connected.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
