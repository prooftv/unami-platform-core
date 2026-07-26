import { clsx } from "clsx";

type AppShellProps = {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  return (
    <div
      className={clsx(
        "flex h-screen w-full overflow-hidden bg-background",
        className,
      )}
    >
      {/* Sidebar — hidden on mobile, visible md+ */}
      {sidebar && (
        <div className="hidden md:flex md:shrink-0">
          {sidebar}
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {header}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
