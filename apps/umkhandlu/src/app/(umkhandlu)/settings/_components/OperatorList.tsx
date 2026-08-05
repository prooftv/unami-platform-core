'use client';

import { useActionState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateOperatorRoleAction, removeOperatorAction } from './actions';

type AuthUser = {
  id: string;
  email: string;
  app_metadata: { role?: string };
  last_sign_in_at: string | null;
  created_at: string;
};

function RoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [state, action, pending] = useActionState(updateOperatorRoleAction, null);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select name="role" defaultValue={currentRole}>
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="operator">Operator</SelectItem>
          <SelectItem value="super_admin">Super Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs" disabled={pending}>
        {pending ? '…' : 'Save'}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

function RemoveForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(removeOperatorAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant="destructive" className="h-7 text-xs" disabled={pending}>
        {pending ? '…' : 'Remove'}
      </Button>
      {state?.error && <span className="text-xs text-destructive ml-2">{state.error}</span>}
    </form>
  );
}

export function OperatorList({
  operators,
  currentUserId,
}: {
  operators: AuthUser[];
  currentUserId: string;
}) {
  if (operators.length === 0) {
    return <p className="text-sm text-muted-foreground">No operators found.</p>;
  }

  return (
    <ul className="divide-y">
      {operators.map((op) => {
        const role = op.app_metadata?.role ?? 'operator';
        const isSelf = op.id === currentUserId;
        return (
          <li key={op.id} className="py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{op.email}</p>
                <p className="text-xs text-muted-foreground">
                  {op.last_sign_in_at
                    ? `Last sign in ${new Date(op.last_sign_in_at).toLocaleDateString()}`
                    : `Joined ${new Date(op.created_at).toLocaleDateString()}`}
                  {isSelf && <span className="ml-2 text-muted-foreground">(you)</span>}
                </p>
              </div>
              <Badge variant={role === 'super_admin' ? 'default' : 'secondary'} className="shrink-0">
                {role === 'super_admin' ? 'Super Admin' : 'Operator'}
              </Badge>
            </div>
            {!isSelf && (
              <div className="flex items-center gap-3 flex-wrap">
                <RoleForm userId={op.id} currentRole={role} />
                <RemoveForm userId={op.id} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
