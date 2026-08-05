'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateProfileAction } from './actions';

export function ProfileForm({
  currentName,
  email,
  role,
}: {
  currentName: string;
  email: string;
  role: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-muted" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" name="name" defaultValue={currentName} placeholder="Your name" />
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <div>
          <Badge variant={role === 'super_admin' ? 'default' : 'secondary'}>
            {role === 'super_admin' ? 'Super Admin' : 'Operator'}
          </Badge>
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-muted-foreground">Profile updated.</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
