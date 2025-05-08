"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useGlobalLoader } from "@/app/components/GlobalLoader";

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
}

/**
 * Hook personnalisé pour la navigation avec indicateur de chargement
 */
export function useRouter() {
  const router = useNextRouter();
  const { showLoader, hideLoader } = useGlobalLoader();

  /**
   * Naviguer avec un indicateur de chargement
   */
  const navigateWithLoading = (url: string, options: NavigateOptions = {}) => {
    const {
      loadingMessage = "Chargement...",
      loadingTimeout = 5000,
      onComplete,
      onError,
      delay = 0,
      hapticFeedback = true,
    } = options;

    try {
      // Afficher le loader immédiatement
      showLoader(loadingMessage);

      // Appliquer un retour haptique si demandé
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate([15, 30, 15]);
      }

      // Configurer un timeout de sécurité
      const timeoutId = setTimeout(() => {
        hideLoader();
      }, loadingTimeout);

      // Naviguer après le délai spécifié
      setTimeout(() => {
        router.push(url);

        // Cacher le loader après un court délai pour permettre
        // à la page de commencer à charger
        setTimeout(() => {
          hideLoader();
          clearTimeout(timeoutId);

          if (onComplete) {
            onComplete();
          }
        }, 300);
      }, delay);
    } catch (error) {
      hideLoader();

      if (onError) {
        onError(error);
      } else {
        console.error("Erreur lors de la navigation:", error);
      }
    }
  };

  // Retourner le router Next.js original plus notre méthode personnalisée
  return {
    ...router,
    navigateWithLoading,
  };
}
