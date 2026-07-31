import { clsx } from "clsx";

type ContentLayoutProps = { children: React.ReactNode; className?: string };

export function ContentLayout({ children, className }: ContentLayoutProps) {
  return (
    <div className={clsx("w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 [[data-content-layout=centered]_&]:mx-auto [[data-content-layout=centered]_&]:max-w-[1440px]", className)}>
      {children}
    </div>
  );
}
