'use client';

import { useRouter } from 'next/navigation';
import { ShellSearchDialog, type ShellSearchItem } from '@unami/ui';
import { sidebarItems } from '@/navigation/sidebar/sidebar-items';

const searchItems: ShellSearchItem[] = sidebarItems.flatMap((group) =>
  group.items.flatMap((item) => {
    if ('subItems' in item && item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        group: item.title,
        label: sub.title,
        url: sub.url,
        icon: item.icon,
      }));
    }
    return [{ id: item.id, group: group.label ?? 'Navigation', label: item.title, url: (item as { url: string }).url, icon: item.icon }];
  }),
);

export function SearchDialog() {
  const router = useRouter();
  return (
    <ShellSearchDialog
      items={searchItems}
      onNavigate={(url) => router.push(url)}
      placeholder="Search pages…"
    />
  );
}
