'use client';

import { useRouter } from 'next/navigation';
import { ShellNavUser } from '@unami/ui';
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  content_admin: 'Content Admin',
  moderator: 'Moderator',
  viewer: 'Viewer',
};

export function NavUser({ name, email, role }: { name: string; email: string; role: string }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  return (
    <ShellNavUser
      name={name}
      email={email}
      role={role}
      roleLabels={ROLE_LABELS}
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
