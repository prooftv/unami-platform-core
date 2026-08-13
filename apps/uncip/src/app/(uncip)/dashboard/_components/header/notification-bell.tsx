'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AlertTimelineAction } from '@unami/api';

interface NotificationRow {
  id: string;
  timeline_entry_id: string;
  read_at: string | null;
  created_at: string;
  uncip_alert_timeline: {
    action: AlertTimelineAction;
    actor_name: string | null;
    actor_role: string;
    alert_id: string;
  } | null;
}

const ACTION_LABEL: Record<AlertTimelineAction, string> = {
  alert_raised:                 'Alert raised',
  school_confirmed_last_seen:   'School confirmed last seen',
  authority_assigned_case:      'Case number assigned',
  community_sighting_reported:  'Sighting reported',
  status_changed:               'Alert status changed',
  note_added:                   'Note added',
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const supabase = createClient();

  const fetchUnread = useCallback(async () => {
    const { data } = await supabase
      .from('uncip_notifications')
      .select('id, timeline_entry_id, read_at, created_at, uncip_alert_timeline(action, actor_name, actor_role, alert_id)')
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as unknown as NotificationRow[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchUnread();

    const channel = supabase
      .channel('uncip_notifications_bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uncip_notifications' }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread, supabase]);

  const markRead = async (id: string) => {
    await supabase.rpc('uncip_mark_notification_read', { notification_id: id });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No new notifications</div>
        ) : (
          notifications.map((n) => {
            const entry = n.uncip_alert_timeline;
            if (!entry) return null;
            return (
              <DropdownMenuItem
                key={n.id}
                className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer"
                onClick={() => markRead(n.id)}
                asChild
              >
                <a href={`/alerts/${entry.alert_id}`}>
                  <span className="text-sm font-medium">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </span>
                  {entry.actor_name && (
                    <span className="text-xs text-muted-foreground">
                      by {entry.actor_name} · {entry.actor_role}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </a>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
