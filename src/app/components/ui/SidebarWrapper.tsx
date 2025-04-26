"use client";

import { Sidebar } from "@/app/components/ui/sidebar";
import { usePathname } from "next/navigation";

const HIDDEN_SIDEBAR_PATHS = ["/", "/signin", "/signup"];

export default function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = HIDDEN_SIDEBAR_PATHS.includes(pathname);

  if (hideSidebar) return <>{children}</>;

  return (
    <div className="flex">
      <Sidebar> </Sidebar>
      <div className="flex-1">{children}</div>
    </div>
  );
}
