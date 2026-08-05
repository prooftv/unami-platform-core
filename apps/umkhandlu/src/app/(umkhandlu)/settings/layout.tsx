import type { ReactNode } from 'react';
import { PageHeader } from '@unami/ui';
import { Separator } from '@/components/ui/separator';
import { SettingsNav } from './_components/settings-nav';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and Control Centre preferences"
      />
      <Separator />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="w-full shrink-0 lg:w-48">
          <SettingsNav />
        </aside>
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
