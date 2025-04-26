"use client";

import { Sidebar } from "@/app/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { SidebarBody, SidebarLink } from "@/app/components/ui/sidebar";

import {
  IconHome,
  IconListCheck,
  IconCalendar,
  IconUser,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";

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
      <Sidebar>
        <SidebarBody>
          <SidebarLink
            link={{
              label: "Dashboard",
              href: "/dashboard",
              icon: <IconHome />,
            }}
          />
          <SidebarLink
            link={{ label: "Tâches", href: "/tasks", icon: <IconListCheck /> }}
          />
          <SidebarLink
            link={{ label: "Agenda", href: "/agenda", icon: <IconCalendar /> }}
          />
          <SidebarLink
            link={{ label: "Profil", href: "/profile", icon: <IconUser /> }}
          />
          <SidebarLink
            link={{
              label: "Paramètres",
              href: "/settings",
              icon: <IconSettings />,
            }}
          />
          <SidebarLink
            link={{
              label: "Déconnexion",
              href: "/logout",
              icon: <IconLogout />,
            }}
          />
        </SidebarBody>
      </Sidebar>
      <div className="flex-1">{children}</div>
    </div>
  );
}
