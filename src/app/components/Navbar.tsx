"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

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
      // Vérifie si le clic est en dehors des menus et des boutons
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

    // Ajout de l'événement seulement si le menu est ouvert
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav className="w-full bg-white border-b px-4 py-2 flex justify-between items-center">
      <Link href="/dashboard" className="font-bold text-2xl font-serif italic">
        PlanniKeeper
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="hidden sm:block hover:text-blue-600 transition"
        >
          Dashboard
        </Link>
        {user ? (
          <div className="relative">
            <button
              ref={avatarButtonRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition focus:outline-none"
              aria-label="Ouvrir le menu utilisateur"
            >
              {/* Avatar générique */}
              <svg
                className="w-7 h-7 text-gray-500"
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
                className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50"
              >
                <div className="px-4 py-2 border-b">{user.name}</div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={closeMenu}
                >
                  Mon profil
                </Link>
                <Link
                  href="/signout"
                  className="block px-4 py-2 hover:bg-gray-100"
                  onClick={closeMenu}
                >
                  Déconnexion
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              href="/signin"
              className="px-3 py-1 rounded hover:bg-blue-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
      {/* Menu mobile */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="sm:hidden absolute top-16 right-4 bg-white border rounded-lg shadow-lg z-50 w-48"
        >
          {user ? (
            <>
              <div className="px-4 py-2 border-b">{user.name}</div>
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={closeMenu}
              >
                Mon profil
              </Link>
              <Link
                href="/signout"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={closeMenu}
              >
                Déconnexion
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block px-4 py-2 hover:bg-gray-100"
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
