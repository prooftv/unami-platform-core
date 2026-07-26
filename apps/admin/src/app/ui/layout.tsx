import type { ReactNode } from "react";
import { ShowcaseShell } from "./_components/ShowcaseShell";

export default function UIShowcaseLayout({ children }: { children: ReactNode }) {
  return <ShowcaseShell>{children}</ShowcaseShell>;
}
