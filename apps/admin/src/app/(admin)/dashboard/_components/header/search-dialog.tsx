'use client';

import { useRouter } from 'next/navigation';
import { ShellSearchDialog, type ShellSearchItem } from '@unami/ui';
import { sidebarItems } from '@/navigation/sidebar/sidebar-items';

const sidebarGroupLabels = new Set(sidebarItems.flatMap((g) => (g.label ? [g.label] : [])));

const searchItems: ShellSearchItem[] = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) => {
    if (item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        group: sidebarGroupLabels.has(item.title) ? (group.label ?? 'Other') : item.title,
        label: sub.title,
        url: sub.url,
        icon: item.icon,
        disabled: sub.disabled,
        newTab: sub.newTab,
      }));
    }
    return [{ id: item.id, group: group.label ?? 'Other', label: item.title, url: item.url, icon: item.icon, disabled: item.disabled, newTab: item.newTab }];
  }),
);

export function SearchDialog() {
  const router = useRouter();
  return (
    <ShellSearchDialog
      items={searchItems}
      onNavigate={(url, newTab) => {
        if (newTab) { window.open(url, '_blank', 'noopener,noreferrer'); }
        else { router.push(url); }
      }}
      placeholder="Search dashboards, users, and more…"
    />
  );
}
