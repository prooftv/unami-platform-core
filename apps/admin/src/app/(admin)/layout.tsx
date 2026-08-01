import { redirect } from "next/navigation";
import { getOperatorSession } from "@/lib/auth/operator";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getOperatorSession();
  if (!session) redirect("/login");
  return <>{children}</>;
}
