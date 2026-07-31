import React from "react";
import { clsx } from "clsx";

type CardProps = { children: React.ReactNode; className?: string };

export function Card({ children, className }: CardProps) {
  return <div className={clsx("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
}
export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx("flex flex-col gap-1.5 p-5 md:p-6", className)}>{children}</div>;
}
export function CardTitle({ children, className }: CardProps) {
  return <h3 className={clsx("text-sm font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}
export function CardDescription({ children, className }: CardProps) {
  return <p className={clsx("text-sm leading-relaxed text-muted-foreground", className)}>{children}</p>;
}
export function CardContent({ children, className }: CardProps) {
  return <div className={clsx("p-5 pt-0 md:p-6 md:pt-0", className)}>{children}</div>;
}
export function CardFooter({ children, className }: CardProps) {
  return <div className={clsx("flex items-center p-5 pt-0 md:p-6 md:pt-0", className)}>{children}</div>;
}
