"use client";

import {
  HomeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const NAV_ITEMS = [
  { id: "hero", icon: HomeIcon, label: "Accueil" },
  { id: "features", icon: RocketLaunchIcon, label: "Fonctionnalités" },
  { id: "pricing", icon: CurrencyDollarIcon, label: "Tarifs" },
];

export default function Header() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
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
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 py-6 px-8 transition-all duration-300 ${
        scrolled ? "bg-transparent backdrop-blur-sm py-3" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo on the left - fades out on scroll */}
        <motion.div
          style={{ opacity: sideOpacity, scale: sideScale }}
          className="text-3xl font-bold tracking-widest font-mono"
        >
          plannikeeper
        </motion.div>

        {/* Navigation - centered and stays visible */}
        <motion.nav
          className="fixed left-1/2 transform -translate-x-1/2 z-50"
          style={{ scale: navScale }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className={`flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg transition-all duration-300 ${
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

        {/* Start button on the right - fades out on scroll */}
        <motion.div style={{ opacity: sideOpacity, scale: sideScale }}>
          <button
            onClick={() => scrollToSection("pricing")}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg font-bold text-xl transition-all duration-300 hover:bg-gray-800 hover:scale-105"
          >
            start
            <ArrowUpRightIcon className="h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </header>
  );
}
