"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function MobileNav({ open, onClose, children, className }: MobileNavProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar w-72 shadow-xl transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <div className="flex h-14 items-center justify-end border-b border-sidebar-border px-4">
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
