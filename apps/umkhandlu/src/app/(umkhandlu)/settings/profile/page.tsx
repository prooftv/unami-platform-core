import { getOperatorSession } from '@/lib/auth/operator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '../ProfileForm';

export default async function ProfilePage() {
  const session = await getOperatorSession();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your operator account details</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            currentName={session?.name ?? ''}
            email={session?.email ?? ''}
            role={session?.role ?? 'operator'}
          />
        </CardContent>
      </Card>
    </div>
  );
}
