"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useLoadingSystem } from "@/app/components/LoadingSystem";
import { useState } from "react";

interface NavigateOptions {
  // Message à afficher pendant le chargement
  loadingMessage?: string;

  // Durée maximale d'affichage du loader (en ms)
  loadingTimeout?: number;

  // Callback après la navigation
  onComplete?: () => void;

  // Callback en cas d'erreur
  onError?: (error: unknown) => void;

  // Appliquer un délai avant de naviguer, utile pour montrer le loader
  delay?: number;

  // Déclencher un retour haptique sur les appareils mobiles
  hapticFeedback?: boolean;

  // Doit-on afficher un loader global
  useGlobalLoader?: boolean;

  // Doit-on activer le loader instantané (sans délai d'animation)
  instantLoader?: boolean;
}

// État pour suivre les navigations en cours et éviter les doublons
const activeNavigations = new Set<string>();

/**
 * Hook personnalisé pour la navigation avec indicateur de chargement
 */
export function useRouter() {
  const router = useNextRouter();
  const { showLoader, hideLoader } = useLoadingSystem();
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Naviguer avec un indicateur de chargement
   */
  const navigateWithLoading = async (
    url: string,
    options: NavigateOptions = {}
  ) => {
    const {
      loadingMessage = "Chargement...",
      onComplete,
      onError,
      hapticFeedback = true,
      instantLoader = true,
    } = options;

    // Éviter les navigations dupliquées
    if (activeNavigations.has(url)) {
      return;
    }

    // Ajouter à la liste des navigations actives
    activeNavigations.add(url);
    setIsNavigating(true);

    // Feedback visuel immédiat
    document.body.classList.add("navigation-pending");

    try {
      // Créer un loader avec le nouveau système
      const loaderId = showLoader({
        message: loadingMessage,
        source: "manualNavigation",
        priority: 15, // Priorité élevée pour les navigations manuelles
        skipDelay: instantLoader,
      });

      // Feedback haptique en parallèle (ne pas attendre)
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate([15, 30, 15]);
      }

      // Navigation
      router.push(url);

      // Nettoyage et finalisation après navigation
      setTimeout(() => {
        hideLoader(loaderId);
        setIsNavigating(false);
        activeNavigations.delete(url);
        document.body.classList.remove("navigation-pending");

        if (onComplete) {
          onComplete();
        }
      }, 500);
    } catch (error) {
      // Gestion des erreurs
      setIsNavigating(false);
      activeNavigations.delete(url);
      document.body.classList.remove("navigation-pending");

      if (onError) {
        onError(error);
      } else {
        console.error("Erreur lors de la navigation:", error);
      }
    }
  };

  // Fonction simplifiée pour les retours en arrière
  const goBack = (fallbackUrl: string = "/dashboard") => {
    // Feedback visuel immédiat
    document.body.classList.add("navigation-pending");

    // Créer un loader
    const loaderId = showLoader({
      message: "Retour...",
      source: "backNavigation",
      priority: 15,
      skipDelay: true,
    });

    if (window.history.length > 2) {
      // Retour en arrière
      setTimeout(() => {
        router.back();
      }, 10);
    } else {
      // Ou navigation vers le fallback
      setTimeout(() => {
        router.push(fallbackUrl);
      }, 10);
    }

    // Masquer le loader après un délai raisonnable
    setTimeout(() => {
      hideLoader(loaderId);
      document.body.classList.remove("navigation-pending");
    }, 500);
  };

  // Retourner le router Next.js original plus nos méthodes personnalisées
  return {
    ...router,
    navigateWithLoading,
    goBack,
    isNavigating,
  };
}
