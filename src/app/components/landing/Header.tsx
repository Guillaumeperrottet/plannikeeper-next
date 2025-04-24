"use client";

import Link from "next/link";
import {
  HomeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon },
  { id: "features", icon: RocketLaunchIcon },
  { id: "pricing", icon: CurrencyDollarIcon },
];

export default function Header() {
  const [active, setActive] = useState("hero");

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      let current = "hero";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 80) {
            current = item.id;
          }
        }
      }
      setActive(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full z-50 pointer-events-none">
      <div className="container mx-auto flex items-center justify-between py-6 relative">
        {/* Logo à gauche */}
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="text-3xl font-bold tracking-widest font-mono"
            style={{ fontFamily: "'VT323', monospace" }}
          >
            plannikeeper
          </Link>
        </div>
        {/* Barre de navigation centrée */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
          <div className="flex items-center gap-4 bg-gray-200/80 rounded-full px-6 py-2 shadow-inner">
            {NAV_ITEMS.map(({ id, icon: Icon }) => (
              <Link
                key={id}
                href={`#${id}`}
                className={`p-2 rounded-full transition ${
                  active === id ? "bg-black" : "hover:bg-black/20"
                }`}
                onClick={() => setActive(id)}
              >
                <Icon
                  className={`h-6 w-6 ${
                    active === id ? "text-white" : "text-gray-500"
                  }`}
                />
              </Link>
            ))}
          </div>
        </nav>
        {/* Bouton start à droite */}
        <div className="pointer-events-auto">
          <Link
            href="#pricing"
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold text-xl font-mono"
            style={{ fontFamily: "'VT323', monospace" }}
            onClick={() => setActive("pricing")}
          >
            start
            <ArrowUpRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
