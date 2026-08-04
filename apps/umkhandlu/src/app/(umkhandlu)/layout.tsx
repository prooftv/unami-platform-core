import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { AppSidebar } from './dashboard/_components/sidebar/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default async function UmkhandluLayout({ children }: { children: ReactNode }) {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  const user = {
    name: session.name ?? '',
    email: session.email,
    role: session.role,
  };

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={{ '--sidebar-width': 'calc(var(--spacing) * 64)' } as React.CSSProperties}
    >
      <AppSidebar user={user} />
      <SidebarInset className={cn('min-w-0 overflow-x-clip')}>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
          <div className="flex w-full items-center px-4 lg:px-6 gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
