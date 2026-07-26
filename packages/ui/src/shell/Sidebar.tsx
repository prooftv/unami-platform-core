"use client";

import { clsx } from "clsx";

import type { NavigationSection } from "../navigation/types";

type SidebarProps = {
  sections: NavigationSection[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  className?: string;
  onNavigate?: (href: string) => void;
  activePath?: string;
};

export function Sidebar({
  sections,
  header,
  footer,
  collapsed = false,
  className,
  onNavigate,
  activePath,
}: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={clsx(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-14" : "w-60",
        className,
      )}
    >
      {header && (
        <div className={clsx("flex items-center border-b border-sidebar-border", collapsed ? "h-14 justify-center px-0" : "h-14 px-4")}>
          {header}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-2">
            {section.title && !collapsed && (
              <p className="px-4 py-1.5 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul>
              {section.items.map((item) => {
                const isActive = activePath ? activePath === item.href || (!item.exact && activePath.startsWith(item.href + "/")) : false;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <a
                      href={item.disabled ? undefined : item.href}
                      onClick={
                        onNavigate && !item.disabled
                          ? (e) => {
                              e.preventDefault();
                              onNavigate(item.href);
                            }
                          : undefined
                      }
                      aria-current={isActive ? "page" : undefined}
                      aria-disabled={item.disabled}
                      className={clsx(
                        "flex items-center gap-3 rounded-md mx-2 px-2 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        item.disabled && "opacity-50 pointer-events-none",
                        collapsed && "justify-center px-0 mx-2",
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span className="ml-auto text-xs bg-sidebar-primary/10 text-sidebar-primary rounded-full px-1.5 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {footer && (
        <div className={clsx("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
          {footer}
        </div>
      )}
    </aside>
  );
}
