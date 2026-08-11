'use client';

/**
 * DEVELOPMENT TOOL — FOUNDATION PHASE ONLY
 *
 * Allows switching the active mock session role without a real auth system.
 * This component must be removed when the UNCIP auth phase begins.
 * It does not implement authorization — it only changes which mock session is active.
 */

import { useTransition } from 'react';
import { UNCIP_ROLE_LABELS, type UNCIPRole } from '@/domain/uncip';
import { setMockRole } from '@/server/server-actions';

const ROLES: UNCIPRole[] = ['admin', 'parent', 'school', 'authority', 'community'];

export function RoleSwitcher({ currentRole }: { currentRole: UNCIPRole }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-1 dark:bg-amber-950/30">
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">
        DEV
      </span>
      <select
        value={currentRole}
        disabled={isPending}
        onChange={(e) => {
          const role = e.target.value as UNCIPRole;
          startTransition(() => { setMockRole(role); });
        }}
        className="bg-transparent text-xs text-amber-700 dark:text-amber-400 cursor-pointer focus:outline-none disabled:opacity-50"
        aria-label="Switch mock role"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {UNCIP_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
