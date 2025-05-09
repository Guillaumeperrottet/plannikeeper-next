"use client";

import {
  HomeIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
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
import PremiumBurgerButton from "@/app/components/ui/BurgerButton";

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

  // Effet pour le verrouillage du scroll quand le menu est ouvert
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

  // Effet pour le verrouillage du scroll quand le menu est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      // Sauvegarde la position de défilement actuelle
      const scrollPosition = window.pageYOffset;
      // Désactive le défilement et fixe la position
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = "100%";
    } else {
      // Restaure le défilement et la position
      const scrollPosition = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollPosition || "0") * -1);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
    setMobileMenuOpen(false); // Ferme le menu mobile après la sélection
  };

  // Générer un effet de feedback haptique sur mobile
  const triggerHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const toggleMobileMenu = () => {
    triggerHapticFeedback();
    setMobileMenuOpen(!mobileMenuOpen);
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
        <div className="md:hidden">
          <PremiumBurgerButton
            isOpen={mobileMenuOpen}
            onClick={toggleMobileMenu}
            variant={scrolled ? "primary" : "light"}
          />
        </div>

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
                    ? "bg-[#d9840d] text-white"
                    : "text-[#62605d] hover:bg-[#e8ebe0]"
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

        {/* Mobile Menu Overlay avec animation améliorée */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                }}
                className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-[#f9f3ec] z-50 shadow-xl rounded-l-3xl border-l border-[#beac93] flex flex-col overflow-y-auto"
                style={{
                  maxHeight: "100vh",
                  overflowY: "auto",
                }}
              >
                {/* En-tête du menu mobile */}
                <div className="p-6 border-b border-[#beac93] flex items-center justify-between">
                  <div
                    className={`text-2xl font-bold ${vt323.className} text-[#141313]`}
                  >
                    plannikeeper
                  </div>
                  <PremiumBurgerButton
                    isOpen={true}
                    onClick={toggleMobileMenu}
                    variant="light"
                  />
                </div>

                {/* Contenu du menu mobile */}
                <div className="flex-1 overflow-y-auto py-6 px-6">
                  <nav className="flex flex-col space-y-4">
                    {NAV_ITEMS.map(({ id, icon: Icon, label }, index) => (
                      <motion.button
                        key={id}
                        onClick={() => scrollToSection(id)}
                        className={`w-full p-4 rounded-xl transition duration-300 flex items-center gap-3 ${
                          activeSection === id
                            ? "bg-[#d9840d] text-white shadow-md"
                            : "bg-white text-[#141313] hover:bg-[#e8ebe0] border border-[#beac93]"
                        }`}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-base font-medium">{label}</span>
                      </motion.button>
                    ))}
                  </nav>
                </div>

                {/* Pied du menu mobile */}
                <div className="p-6 border-t border-[#beac93]">
                  <Link
                    href="/dashboard"
                    className={`w-full justify-center flex items-center gap-2 bg-[#d9840d] hover:bg-[#c6780c] text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-md`}
                    onClick={() => {
                      triggerHapticFeedback();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Se connecter
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 1.5,
                        repeatDelay: 2,
                      }}
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </motion.svg>
                  </Link>

                  <motion.p
                    className="text-center text-[#62605d] text-sm mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Simplifiez la gestion de vos projets immobiliers
                  </motion.p>
                </div>
              </motion.div>
            </>
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
