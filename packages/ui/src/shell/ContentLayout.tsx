import React from "react";


type ContentLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContentLayout({ children, className }: ContentLayoutProps) {
  return (
    <div
      className={`w-full px-4 py-6 md:px-6 lg:px-8
        [[data-content-layout=centered]_&]:max-w-5xl
        [[data-content-layout=centered]_&]:mx-auto
        ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
