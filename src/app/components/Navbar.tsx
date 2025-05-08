// Modification du composant Navbar.tsx

"use client";

import { VT323 } from "next/font/google";
import Switch from "@/app/components/ui/switchmode";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import UserMenu from "@/app/components/ui/UserMenu";
import NotificationIndicator from "./NotificationIndicator";
import { useRouter } from "@/lib/router-helper";
import { useGlobalLoader } from "@/app/components/GlobalLoader";

interface User {
  id: string;
  role?: string;
  isAdmin?: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

export default function Navbar({ user }: { user: User }) {
  const isAdmin = user?.role === "admin" || user?.isAdmin;
  const customRouter = useRouter();
  const { showLoaderImmediately } = useGlobalLoader();

  // Fonction optimisée pour la navigation vers le dashboard
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Feedback visuel immédiat
    e.currentTarget.classList.add("active-navigation");

    // 2. Afficher immédiatement le loader
    showLoaderImmediately("Chargement du dashboard...");

    // 3. Feedback tactile si disponible
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    // 4. Navigation avec priorité
    setTimeout(() => {
      customRouter.navigateWithLoading("/dashboard", {
        instantLoader: true,
        delay: 0,
      });
    }, 10); // Délai minime pour permettre le rendu du loader
  };

  return (
    <nav
      className="w-full border-b px-3 md:px-4 py-2 flex justify-between items-center relative z-50"
      style={{
        background: "var(--background)",
        borderColor: "var(--border)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Logo avec gestion optimisée du clic */}
      <a
        href="/dashboard"
        onClick={handleLogoClick}
        className={`text-2xl md:text-4xl font-bold text-[color:var(--foreground)] transition-transform active:scale-95 ${vt323.className}`}
        style={{
          transition: "color 0.3s, transform 0.1s",
        }}
      >
        PlanniKeeper
      </a>

      {/* Reste du code inchangé */}
      <div className="hidden md:flex flex-1 justify-center">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Switch />
        <NotificationIndicator />
        <UserMenu user={user} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
