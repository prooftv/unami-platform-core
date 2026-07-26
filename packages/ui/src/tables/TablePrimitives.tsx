import React from "react";

import { clsx } from "clsx";

type Props = { children: React.ReactNode; className?: string };

export function TableContainer({ children, className }: Props) {
  return (
    <div className={clsx("w-full overflow-auto rounded-md border", className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: Props) {
  return <thead className={clsx("[&_tr]:border-b", className)}>{children}</thead>;
}

export function TableBody({ children, className }: Props) {
  return <tbody className={clsx("[&_tr:last-child]:border-0", className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: Props & { onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className }: Props) {
  return (
    <th className={clsx("h-10 px-4 text-left align-middle font-medium text-muted-foreground", className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: Props) {
  return <td className={clsx("px-4 py-3 align-middle", className)}>{children}</td>;
}
