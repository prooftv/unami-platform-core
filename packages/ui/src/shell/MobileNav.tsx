"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

type MobileNavProps = { open: boolean; onClose: () => void; children: React.ReactNode; className?: string };

export function MobileNav({ open, onClose, children, className }: MobileNavProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <>
      <button type="button" aria-label="Close navigation" onClick={onClose} className={clsx("fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity md:hidden", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} />
      <div role="dialog" aria-modal="true" aria-label="Navigation" className={clsx("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar shadow-xl transition-transform duration-200 md:hidden", open ? "translate-x-0" : "-translate-x-full", className)}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <span className="text-sm font-semibold text-sidebar-foreground">Moments</span>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
