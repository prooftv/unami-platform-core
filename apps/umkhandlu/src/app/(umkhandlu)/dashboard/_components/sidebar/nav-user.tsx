'use client';

import { useRouter } from 'next/navigation';
import { EllipsisVertical, LogOut, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  operator: 'Operator',
};

function getInitials(str: string): string {
  return str.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export function NavUser({ name, email, role }: { name: string; email: string; role: string }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                {getInitials(name || email)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name || email}</span>
                <span className="truncate text-muted-foreground text-xs">{ROLE_LABELS[role] ?? role}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn('w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg')}
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-medium">
                  {getInitials(name || email)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name || email}</span>
                  <span className="truncate text-muted-foreground text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Shield />
              {ROLE_LABELS[role] ?? role}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
