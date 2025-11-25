"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";

interface FooterProps {
  onAboutClick?: (location: string) => void;
  onContactClick?: (location: string) => void;
}

export default function Footer({ onAboutClick, onContactClick }: FooterProps) {
  const handleLinkClick = (linkName: string) => {
    track("footer_link_clicked", {
      link: linkName,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAboutClick = () => {
    handleLinkClick("about");
    if (onAboutClick) {
      onAboutClick("footer");
    }
  };

  const handleContactClick = () => {
    handleLinkClick("contact");
    if (onContactClick) {
      onContactClick("footer");
    }
  };

  return (
    <footer className="py-16 bg-[#19140d] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 font-mono">plannikeeper</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              La solution complète pour la gestion immobilière professionnelle.
              Simplifiez vos opérations et optimisez votre temps.
            </p>
            <div className="border-l-4 border-[#d9840d] pl-4 py-2 bg-white/5 rounded-r">
              <p className="text-sm text-gray-300 mb-1">
                Développé par{" "}
                <a
                  href="https://www.webbing.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d9840d] hover:text-[#c6780c] font-semibold transition-colors"
                >
                  Webbing
                </a>
              </p>
              <p className="text-xs text-gray-400">
                Solutions SaaS innovantes conçues en Suisse
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Produit</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-gray-400 hover:text-[#d9840d] transition-colors"
                  onClick={() => handleLinkClick("features")}
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-gray-400 hover:text-[#d9840d] transition-colors"
                  onClick={() => handleLinkClick("pricing")}
                >
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-[#d9840d] transition-colors"
                  onClick={handleAboutClick}
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-[#d9840d] transition-colors"
                  onClick={handleContactClick}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-[#d9840d] transition-colors"
                  onClick={() => handleLinkClick("privacy")}
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#d9840d]/20 pt-8 mt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} PlanniKeeper. Tous droits
            réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
