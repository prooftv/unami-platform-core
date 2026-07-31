import { clsx } from "clsx";

type HeaderProps = {
  title?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  userArea?: React.ReactNode;
  className?: string;
};

export function Header({ title, leading, actions, userArea, className }: HeaderProps) {
  return (
    <header
      className={clsx(
        "flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6",
        "[[data-navbar-style=sticky]_&]:sticky [[data-navbar-style=sticky]_&]:top-0 [[data-navbar-style=sticky]_&]:z-30",
        className,
      )}
    >
      {leading}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {title && <div className="truncate text-sm font-medium">{title}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      {userArea && <div className="flex shrink-0 items-center gap-2">{userArea}</div>}
    </header>
  );
}
