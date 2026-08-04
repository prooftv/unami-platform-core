'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem } from '@/navigation/sidebar/sidebar-items';

function hasSubItems(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

export function NavMain({ items }: { items: readonly NavGroup[] }) {
  const path = usePathname();

  const isItemActive = (item: NavMainItem) => {
    if (hasSubItems(item)) return item.subItems.some((sub) => path.startsWith(sub.url));
    return path.startsWith(item.url);
  };

  const isSubItemActive = (url: string) => path === url;
  const isSubmenuOpen = (item: NavMainParentItem) => item.subItems.some((sub) => path.startsWith(sub.url));

  return (
    <>
      {items.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={isItemActive(item)}
                  isSubItemActive={isSubItemActive}
                  defaultOpen={hasSubItems(item) ? isSubmenuOpen(item) : false}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function NavItem({
  item,
  isActive,
  isSubItemActive,
  defaultOpen,
}: {
  item: NavMainItem;
  isActive: boolean;
  isSubItemActive: (url: string) => boolean;
  defaultOpen: boolean;
}) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  if (!hasSubItems(item)) {
    return <NavLinkItem item={item} isActive={isActive} isCollapsed={isCollapsed} />;
  }

  return (
    <Collapsible asChild defaultOpen={defaultOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} disabled={item.disabled}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((sub) => (
              <SidebarMenuSubItem key={sub.id}>
                <SidebarMenuSubButton asChild isActive={isSubItemActive(sub.url)}>
                  <Link prefetch={false} href={sub.url}>
                    {sub.icon && <sub.icon />}
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavLinkItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavMainLinkItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive} aria-disabled={item.disabled}>
        <Link prefetch={false} href={item.url}>
          {item.icon ? (
            <item.icon />
          ) : isCollapsed ? (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-xs font-medium text-[10px] outline">
              {item.title.slice(0, 1)}
            </span>
          ) : null}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
