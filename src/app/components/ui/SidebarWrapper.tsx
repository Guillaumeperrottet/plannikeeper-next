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
        <aside className="w-72 min-h-screen flex flex-col justify-between bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-foreground)]">
          <SidebarBody>
            {/* Logo et nom d'équipe */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--sidebar-border)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--sidebar-accent)] flex items-center justify-center text-xl font-bold">
                △
              </div>
              <div>
                <div className="font-bold text-lg">Team Alpha</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Pro
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="mt-6 px-6">
              <div className="text-xs font-semibold mb-2 text-[var(--muted-foreground)]">
                Main Navigation
              </div>
              <SidebarLink
                link={{
                  label: "Dashboard",
                  href: "/dashboard",
                  icon: <IconHome />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Tâches",
                  href: "/tasks",
                  icon: <IconListCheck />,
                }}
              />
              <SidebarLink
                link={{
                  label: "Agenda",
                  href: "/agenda",
                  icon: <IconCalendar />,
                }}
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
            </div>

            {/* Applications */}
            <div className="mt-8 px-6">
              <div className="text-xs font-semibold mb-2 text-[var(--muted-foreground)]">
                Applications
              </div>
              <SidebarLink
                link={{
                  label: "Project Alpha",
                  href: "#",
                  icon: (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--sidebar-foreground)] mr-2" />
                  ),
                }}
              />
              <SidebarLink
                link={{
                  label: "Project Beta",
                  href: "#",
                  icon: (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--muted-foreground)] mr-2" />
                  ),
                }}
              />
              <SidebarLink
                link={{
                  label: "More",
                  href: "#",
                  icon: (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--muted-foreground)] mr-2">
                      …
                    </span>
                  ),
                }}
              />
            </div>
          </SidebarBody>

          {/* Utilisateur */}
          <div className="px-6 py-4 border-t border-[var(--sidebar-border)] flex items-center gap-3 bg-[var(--muted)]">
            <div className="w-10 h-10 rounded-full bg-[var(--sidebar-accent)] flex items-center justify-center text-lg font-bold text-[var(--sidebar-foreground)]">
              J
            </div>
            <div>
              <div className="font-semibold text-sm">Jane Doe</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                jane.doe@example.com
              </div>
            </div>
            <SidebarLink
              link={{ label: "", href: "/logout", icon: <IconLogout /> }}
            />
          </div>
        </aside>
      </Sidebar>
      <div className="flex-1">{children}</div>
    </div>
  );
}
