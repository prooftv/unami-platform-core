'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to INSERT/UPDATE/DELETE on a Supabase table.
 * Calls onUpdate() on any change so the parent can trigger router.refresh().
 * Lives in apps/admin — Realtime is app-level, not platform-level.
 */
export function useRealtimeTable(
  table: string,
  onUpdate: () => void,
  enabled = true,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdateRef.current();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, enabled]);
}
