"use client";

import Link from "next/link";
import { VT323 } from "next/font/google";
import Switch from "@/app/components/ui/switchmode";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import UserMenu from "@/app/components/ui/UserMenu";
import NotificationIndicator from "./NotificationIndicator";

interface User {
  id: string;
  role?: string;
  isAdmin?: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  // Add other properties as needed based on how user is used
}

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

export default function Navbar({ user }: { user: User }) {
  // Vérifier si l'utilisateur est admin en se basant sur les propriétés attendues
  const isAdmin = user?.role === "admin" || user?.isAdmin;

  return (
    <nav
      className="w-full border-b px-3 md:px-4 py-2 flex justify-between items-center relative z-50"
      style={{
        background: "var(--background)",
        borderColor: "var(--border)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Link
        href="/dashboard"
        className={`text-2xl md:text-4xl font-bold text-[color:var(--foreground)] ${vt323.className}`}
        style={{
          transition: "color 0.3s",
        }}
      >
        PlanniKeeper
      </Link>

      {/* Breadcrumbs - visible uniquement sur tablette/desktop */}
      <div className="hidden md:flex flex-1 justify-center">
        <Breadcrumbs />
      </div>

      {/* Section droite avec Dark Mode Switch et User Menu */}
      <div className="flex items-center gap-2 md:gap-4">
        <Switch />
        <NotificationIndicator />
        <UserMenu user={user} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
