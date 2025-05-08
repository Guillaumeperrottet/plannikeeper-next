"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import NavigationLoader from "./NavigationLoader";

// Contexte pour la gestion de navigation
interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: (url: string) => void;
  stopNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Fonction pour démarrer la navigation avec un indicateur visuel
  const startNavigation = useCallback(
    (url: string) => {
      // Vérifier si la navigation est vers une nouvelle page
      if (url !== pathname) {
        setIsNavigating(true);

        // Appliquer une petite temporisation pour éviter les flashs
        // lors de navigations rapides
        setTimeout(() => {
          router.push(url);
        }, 50);
      } else {
        // Si même URL, simplement naviguer sans indicateur
        router.push(url);
      }
    },
    [router, pathname]
  );

  // Fonction pour arrêter l'indicateur de navigation
  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  // Réinitialiser l'état quand le pathname change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Intercepter les clics sur les liens pour gérer notre état de navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Vérifier si c'est un clic sur un lien
      const target = e.target as HTMLElement;
      const linkElement = target.closest("a");

      if (linkElement) {
        const href = linkElement.getAttribute("href");

        // Si c'est un lien interne (pas externe, pas de # ou mailto:, etc.)
        if (
          href &&
          href.startsWith("/") &&
          !linkElement.getAttribute("target")
        ) {
          e.preventDefault();
          startNavigation(href);
        }
      }
    };

    // Ajouter l'écouteur d'événement global
    document.addEventListener("click", handleLinkClick);

    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, [startNavigation]);

  return (
    <NavigationContext.Provider
      value={{ isNavigating, startNavigation, stopNavigation }}
    >
      {children}
      <NavigationLoader />
    </NavigationContext.Provider>
  );
}
