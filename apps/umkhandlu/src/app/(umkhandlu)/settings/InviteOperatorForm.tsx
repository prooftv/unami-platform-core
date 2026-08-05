'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inviteOperatorAction } from './actions';

export function InviteOperatorForm() {
  const [state, action, pending] = useActionState(inviteOperatorAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email address</Label>
        <Input id="invite-email" name="email" type="email" placeholder="operator@example.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <Select name="role" defaultValue="operator">
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-muted-foreground">Operator invited. They will receive a confirmation email.</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? 'Inviting…' : 'Invite Operator'}
        </Button>
      </div>
    </form>
  );
}
