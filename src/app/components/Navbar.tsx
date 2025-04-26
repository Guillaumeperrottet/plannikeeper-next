"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { VT323 } from "next/font/google";
import ThemeToggle from "@/app/components/ThemeToggle";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

type User = {
  name: string;
};

export default function Navbar({ user }: { user?: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Fonction pour fermer le menu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutsideUserMenu =
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node);
      const isOutsideMobileMenu =
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node);
      const isOutsideButtons =
        !avatarButtonRef.current?.contains(event.target as Node) &&
        !hamburgerButtonRef.current?.contains(event.target as Node);

      if (
        (isOutsideUserMenu || !userMenuRef.current) &&
        (isOutsideMobileMenu || !mobileMenuRef.current) &&
        isOutsideButtons
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav className="w-full bg-background border-b border-border px-4 py-2 flex justify-between items-center relative z-50">
      <Link
        href="/dashboard"
        className={`text-4xl font-bold ${vt323.className} text-primary-foreground`}
      >
        PlanniKeeper
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="hidden sm:block hover:text-primary transition text-foreground"
        >
          Dashboard
        </Link>
        <ThemeToggle />
        {/* Bouton avatar visible sur desktop */}
        {user ? (
          <div className="relative hidden sm:block">
            <button
              ref={avatarButtonRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-accent transition focus:outline-none"
              aria-label="Ouvrir le menu utilisateur"
            >
              <svg
                className="w-7 h-7 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
              </svg>
            </button>
            {menuOpen && (
              <div
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50"
              >
                <div className="px-4 py-2 border-b border-border text-foreground">
                  {user.name}
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:bg-accent text-foreground"
                  onClick={closeMenu}
                >
                  Mon profil
                </Link>
                <Link
                  href="/signout"
                  className="block px-4 py-2 hover:bg-destructive hover:text-destructive-foreground text-foreground"
                  onClick={closeMenu}
                >
                  Déconnexion
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2 sm:flex">
            <Link
              href="/signin"
              className="px-3 py-1 rounded hover:bg-accent transition text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
        {/* Bouton hamburger visible sur mobile */}
        <button
          ref={hamburgerButtonRef}
          className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-accent transition"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ouvrir le menu mobile"
        >
          <svg
            className="w-7 h-7 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>
      </div>
      {/* Menu mobile */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="sm:hidden absolute top-16 right-4 bg-card border border-border rounded-lg shadow-lg z-50 w-48"
        >
          {user ? (
            <>
              <div className="px-4 py-2 border-b border-border text-foreground">
                {user.name}
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-accent text-foreground"
                onClick={closeMenu}
              >
                Mon profil
              </Link>
              <Link
                href="/signout"
                className="block px-4 py-2 hover:bg-destructive hover:text-destructive-foreground text-foreground"
                onClick={closeMenu}
              >
                Déconnexion
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="block px-4 py-2 hover:bg-accent text-foreground"
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 hover:bg-primary text-primary-foreground"
                onClick={closeMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
