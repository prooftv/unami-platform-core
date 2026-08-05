'use client';

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { EllipsisVertical, LogOut, Shield } from 'lucide-react';

function getInitials(str: string): string {
  return str.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium grayscale">
      {initials}
    </span>
  );
}

export interface ShellNavUserProps {
  name: string;
  email: string;
  role: string;
  roleLabels?: Record<string, string>;
  onLogout: () => void;
  isMobile?: boolean;
  /** Render wrapper — pass SidebarMenu from your app's shadcn sidebar */
  renderWrapper?: (children: React.ReactNode) => React.ReactNode;
}

export function ShellNavUser({ name, email, role, roleLabels = {}, onLogout, isMobile = false, renderWrapper }: ShellNavUserProps) {
  const displayRole = roleLabels[role] ?? role;
  const initials = getInitials(name || email);

  const trigger = (
    <DropdownMenuPrimitive.Trigger asChild>
      <button className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
        <Avatar initials={initials} />
        <div className="grid flex-1 min-w-0 text-sm leading-tight">
          <span className="truncate font-medium">{name || email}</span>
          <span className="truncate text-muted-foreground text-xs">{displayRole}</span>
        </div>
        <EllipsisVertical className="ml-auto h-4 w-4 shrink-0" />
      </button>
    </DropdownMenuPrimitive.Trigger>
  );

  const menu = (
    <DropdownMenuPrimitive.Root>
      {trigger}
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          side={isMobile ? 'bottom' : 'right'}
          align="end"
          sideOffset={4}
          className="z-50 min-w-56 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <DropdownMenuPrimitive.Label className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
              <Avatar initials={initials} />
              <div className="grid flex-1 min-w-0 text-sm leading-tight">
                <span className="truncate font-medium">{name || email}</span>
                <span className="truncate text-muted-foreground text-xs">{email}</span>
              </div>
            </div>
          </DropdownMenuPrimitive.Label>
          <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
          <DropdownMenuPrimitive.Item className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground">
            <Shield className="h-4 w-4" />
            {displayRole}
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
          <DropdownMenuPrimitive.Item
            onSelect={onLogout}
            className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );

  return renderWrapper ? <>{renderWrapper(menu)}</> : menu;
}
