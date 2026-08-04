'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toggleNodeAction, deleteNodeAction } from './actions';

export function NodeActions({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleNodeAction(id, !active);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('Remove this node from the registry? This cannot be undone.')) return;
    setLoading(true);
    await deleteNodeAction(id);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleToggle} disabled={loading}>
        {active ? 'Deactivate' : 'Activate'}
      </Button>
      <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
        Remove
      </Button>
    </div>
  );
}
