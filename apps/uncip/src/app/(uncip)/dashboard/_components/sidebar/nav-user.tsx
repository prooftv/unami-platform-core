'use client';

import { useRouter } from 'next/navigation';
import { ShellNavUser } from '@unami/ui';
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UNCIP_ROLE_LABELS, type UNCIPRole } from '@/domain/uncip';

export function NavUser({ name, email, role }: { name: string; email: string; role: string }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  return (
    <ShellNavUser
      name={name}
      email={email}
      role={role}
      roleLabels={UNCIP_ROLE_LABELS as Record<string, string>}
      isMobile={isMobile}
      onLogout={async () => {
        await fetch('/auth/logout', { method: 'POST' });
        router.push('/login');
      }}
      renderWrapper={(children) => (
        <SidebarMenu>
          <SidebarMenuItem>{children}</SidebarMenuItem>
        </SidebarMenu>
      )}
    />
  );
}
