import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import { AdminShell } from './components/AdminShell';
import type { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/login');
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
