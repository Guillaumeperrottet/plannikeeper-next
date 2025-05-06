"use client";

import {
  HomeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { buttonVariants } from "@/app/components/ui/button";
import { VT323 } from "next/font/google";
import Link from "next/link";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon, label: "Accueil" },
  { id: "features", icon: RocketLaunchIcon, label: "Fonctionnalités" },
  { id: "pricing", icon: CurrencyDollarIcon, label: "Tarifs" },
];

export default function Header() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Transform values for the sidebar elements that will fade out
  const sideOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const sideScale = useTransform(scrollY, [0, 100], [1, 0.8]);
  const navScale = useTransform(scrollY, [0, 100], [1, 1.1]);

  // Tracking scroll for active section
  useEffect(() => {
    const handleScroll = () => {
      // Update scrolled state for conditional styling
      setScrolled(window.scrollY > 60);

      // Find active section based on scroll position
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
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Call once initially

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMobileMenuOpen(false); // Ferme le menu mobile après la sélection
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 py-4 md:py-6 px-4 md:px-8 transition-all duration-300 ${
        scrolled
          ? "bg-transparent backdrop-blur-sm py-2 md:py-3"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-8xl mx-auto flex items-center justify-between">
        {/* Logo on the left - fades out on scroll on desktop only */}
        <motion.div
          style={{ opacity: sideOpacity, scale: sideScale }}
          className={`text-3xl md:text-5xl font-bold ${vt323.className} text-black`}
        >
          plannikeeper
        </motion.div>

        {/* Mobile menu button - visible only on mobile */}
        <button
          className="md:hidden z-50 p-2 rounded-full bg-white/90 shadow-md"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-black" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-black" />
          )}
        </button>

        {/* Desktop Navigation - hidden on mobile */}
        <motion.nav
          className="hidden md:block fixed left-1/2 transform -translate-x-1/2 z-50"
          style={{ scale: navScale }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className={`flex items-center gap-6 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg transition-all duration-300 ${
              scrolled ? "px-8 py-3" : ""
            }`}
          >
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`p-2 rounded-full transition duration-300 flex items-center gap-2 ${
                  activeSection === id
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-sm ${scrolled ? "block" : "hidden"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-white/95 z-40 pt-20 px-6"
            >
              <div className="flex flex-col space-y-4 items-center">
                {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`w-full p-4 rounded-xl transition duration-300 flex items-center justify-center gap-3 ${
                      activeSection === id
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-base font-medium">{label}</span>
                  </button>
                ))}

                <Link
                  href="/dashboard"
                  className={`${buttonVariants({ variant: "default" })} w-full justify-center mt-4`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SignIn
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start button on the right - fades out on scroll and hidden on mobile */}
        <motion.div
          style={{ opacity: sideOpacity, scale: sideScale }}
          className="hidden md:block"
        >
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            SignIn
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
