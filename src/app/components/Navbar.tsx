"use client";

import Link from "next/link";
import { useState } from "react";

type User = {
  name: string;
};

export default function Navbar({ user }: { user?: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b px-4 py-2 flex justify-between items-center">
      <Link href="/" className="font-bold text-2xl font-serif italic">PlanniKeeper</Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="hidden sm:block hover:text-blue-600 transition">Dashboard</Link>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition focus:outline-none"
              aria-label="Ouvrir le menu utilisateur"
            >
              {/* Avatar générique */}
              <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <div className="px-4 py-2 border-b">{user.name}</div>
                <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">Mon profil</Link>
                <Link href="/signout" className="block px-4 py-2 hover:bg-gray-100">Déconnexion</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/signin" className="px-3 py-1 rounded hover:bg-blue-50 transition">Sign In</Link>
            <Link href="/signup" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Sign Up</Link>
          </div>
        )}
        {/* Hamburger pour mobile */}
        <button
          className="sm:hidden ml-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Menu mobile */}
      {menuOpen && (
        <div className="sm:hidden absolute top-16 right-4 bg-white border rounded-lg shadow-lg z-50 w-48">
          {user ? (
            <>
              <div className="px-4 py-2 border-b">{user.name}</div>
              <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">Mon profil</Link>
              <Link href="/signout" className="block px-4 py-2 hover:bg-gray-100">Déconnexion</Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="block px-4 py-2 hover:bg-gray-100">Sign In</Link>
              <Link href="/signup" className="block px-4 py-2 hover:bg-gray-100">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
