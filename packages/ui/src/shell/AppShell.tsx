import { clsx } from "clsx";

type AppShellProps = {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  return (
    <div className={clsx("flex min-h-screen w-full bg-muted/30", className)}>
      {sidebar && <div className="hidden shrink-0 md:block">{sidebar}</div>}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {header}
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
