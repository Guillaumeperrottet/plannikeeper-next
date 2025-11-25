"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "features", label: "Fonctionnalités", href: "/#features" },
  { id: "pricing", label: "Tarifs", href: "/#pricing" },
  { id: "about", label: "À propos", href: "/about" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (linkName: string) => {
    track("header_link_clicked", {
      link: linkName,
      timestamp: new Date().toISOString(),
    });
    setMobileMenuOpen(false);
  };

  // Empêcher le scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            onClick={() => handleLinkClick("logo")}
          >
            PlanniKeeper
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-[#d9840d] transition-colors"
                onClick={() => handleLinkClick(item.id)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Menu burger */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#d9840d] rounded-lg hover:bg-[#c6780c] transition-colors"
              onClick={() => handleLinkClick("signin")}
            >
              Se connecter
            </Link>

            {/* Burger menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Header mobile menu */}
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="text-xl font-bold">PlanniKeeper</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Navigation mobile */}
                <nav className="flex-1 p-6">
                  <ul className="space-y-4">
                    {NAV_ITEMS.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="block py-3 text-lg font-medium text-gray-700 hover:text-[#d9840d] transition-colors"
                          onClick={() => handleLinkClick(item.id)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* CTA mobile */}
                <div className="p-6 border-t">
                  <Link
                    href="/dashboard"
                    className="block w-full text-center px-4 py-3 text-sm font-medium text-white bg-[#d9840d] rounded-lg hover:bg-[#c6780c] transition-colors"
                    onClick={() => handleLinkClick("signin_mobile")}
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
