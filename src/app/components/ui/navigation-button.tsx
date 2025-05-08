"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonProps } from "./button";

interface NavigationButtonProps extends ButtonProps {
  href: string;
  loadingText?: string;
  loadingTimeout?: number;
  onNavigationStart?: () => void;
  onNavigationComplete?: () => void;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  children,
  href,
  loadingText = "Chargement...",
  loadingTimeout = 5000,
  onNavigationStart,
  onNavigationComplete,
  ...props
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Empêcher les clics multiples
    if (isNavigating) return;

    // Signaler le début de la navigation
    setIsNavigating(true);
    if (onNavigationStart) onNavigationStart();

    // Configurer un timeout de sécurité
    const timeout = setTimeout(() => {
      setIsNavigating(false);
    }, loadingTimeout);

    // Naviguer vers la destination
    router.push(href);

    // Nettoyer le timeout quand la navigation est terminée
    // (Ceci est une approximation, car Next.js n'a pas d'événement de navigation complète)
    setTimeout(() => {
      setIsNavigating(false);
      clearTimeout(timeout);
      if (onNavigationComplete) onNavigationComplete();
    }, 300);
  };

  return (
    <>
      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
            <p className="text-lg font-medium text-[color:var(--foreground)]">
              {loadingText}
            </p>
          </div>
        </div>
      )}

      <Button
        {...props}
        onClick={handleClick}
        disabled={isNavigating || props.disabled}
      >
        {children}
      </Button>
    </>
  );
};
