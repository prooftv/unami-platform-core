import type { ReactNode } from "react";

type HeaderProps = {
  title?: ReactNode;
  actions?: ReactNode;
  userArea?: ReactNode;
  className?: string;
};

export function Header({ title, actions, userArea, className }: HeaderProps) {
  return (
    <header
      className={`flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6
        [[data-navbar-style=sticky]_&]:sticky
        [[data-navbar-style=sticky]_&]:top-0
        [[data-navbar-style=sticky]_&]:z-40
        ${className ?? ""}`}
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        {title && <div className="truncate text-sm font-medium">{title}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      {userArea && <div className="flex items-center gap-2">{userArea}</div>}
    </header>
  );
}
