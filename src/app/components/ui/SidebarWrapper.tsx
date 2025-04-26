"use client";

import { Sidebar } from "@/app/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { SidebarBody, SidebarLink } from "@/app/components/ui/sidebar";
import { useEffect, useState } from "react";

// Import icons from Tabler Icons
import {
  IconHome,
  IconListCheck,
  IconCalendar,
  IconUser,
  IconSettings,
  IconLogout,
  IconBriefcase,
} from "@tabler/icons-react";

const HIDDEN_SIDEBAR_PATHS = ["/", "/signin", "/signup"];

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

export default function SidebarWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User | null;
}) {
  const pathname = usePathname();
  const hideSidebar = HIDDEN_SIDEBAR_PATHS.includes(pathname);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    if (user?.name) {
      setUserInitial(user.name.charAt(0).toUpperCase());
    } else if (user?.email) {
      setUserInitial(user.email.charAt(0).toUpperCase());
    }
  }, [user]);

  if (hideSidebar) return <>{children}</>;

  // Navigation items
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconHome stroke={1.5} />,
    },
    {
      label: "Objets",
      href: "/dashboard/objet",
      icon: <IconBriefcase stroke={1.5} />,
    },
    {
      label: "Tâches",
      href: "/tasks",
      icon: <IconListCheck stroke={1.5} />,
    },
    {
      label: "Agenda",
      href: "/agenda",
      icon: <IconCalendar stroke={1.5} />,
    },
    {
      label: "Profil",
      href: "/profile",
      icon: <IconUser stroke={1.5} />,
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: <IconSettings stroke={1.5} />,
    },
    {
      label: "Déconnexion",
      href: "/signout",
      icon: <IconLogout stroke={1.5} />,
    },
  ];

  // Override the user component in the sidebar
  const userComponent = (open: boolean) => (
    <>
      <div className="w-10 h-10 bg-[color:var(--muted)] rounded-full flex items-center justify-center text-[color:var(--muted-foreground)] font-semibold">
        {userInitial}
      </div>
      {open && (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {user?.name || "Utilisateur"}
          </span>
          <span className="text-xs text-[color:var(--muted-foreground)]">
            {user?.email || ""}
          </span>
        </div>
      )}
    </>
  );

  return (
    <div className="flex">
      <Sidebar>
        <SidebarBody userComponent={(open) => userComponent(open)}>
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              link={item}
              isActive={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
            />
          ))}
        </SidebarBody>
      </Sidebar>
      <div className="flex-1">{children}</div>
    </div>
  );
}
