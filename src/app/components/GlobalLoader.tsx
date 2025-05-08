"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface GlobalLoaderContextType {
  showLoader: (message?: string) => void;
  showLoaderImmediately: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
  setInstantLoading: (state: boolean) => void; // Nouveau: pour un chargement sans délai
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(
  undefined
);

export const useGlobalLoader = () => {
  const context = useContext(GlobalLoaderContext);
  if (!context) {
    throw new Error(
      "useGlobalLoader must be used within a GlobalLoaderProvider"
    );
  }
  return context;
};

interface GlobalLoaderProviderProps {
  children: ReactNode;
}

export function GlobalLoaderProvider({ children }: GlobalLoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("Chargement...");

  // Nouvel état pour les chargements immédiats
  const [skipDelay, setSkipDelay] = useState(false);

  // Référence pour gérer les timeouts
  const loaderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeInTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Variable d'état pour contrôler l'animation de fondu
  const [opacity, setOpacity] = useState(0);

  const pathname = usePathname();
  const router = useRouter();

  // Réinitialiser le loader lors des changements de chemin
  useEffect(() => {
    hideLoader();
  }, [pathname]);

  // Intercepter les événements de navigation Next.js
  useEffect(() => {
    const handleStart = () => {
      showLoader();
    };

    const handleComplete = () => {
      hideLoader();
    };

    // Ajouter les écouteurs
    window.addEventListener("beforeunload", handleStart);
    document.addEventListener("navigatestart", handleStart);
    document.addEventListener("navigatecomplete", handleComplete);

    // Nettoyer
    return () => {
      window.removeEventListener("beforeunload", handleStart);
      document.removeEventListener("navigatestart", handleStart);
      document.removeEventListener("navigatecomplete", handleComplete);
    };
  }, [router]);

  const showLoaderImmediately = (message?: string) => {
    // Nettoyer tous les timers existants
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current);

    // Définir le message immédiatement
    setMessage(message || "Chargement...");

    // Afficher immédiatement avec opacité complète
    setIsLoading(true);
    setOpacity(1);

    // Forcer un rafraîchissement rapide du DOM
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.style.pointerEvents = "none"; // Désactiver les interactions
      });
    });
  };

  const showLoader = (customMessage?: string) => {
    // Nettoyer tous les timers existants
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current);

    // Toujours définir le message immédiatement
    if (customMessage) {
      setMessage(customMessage);
    } else {
      setMessage("Chargement...");
    }

    // Pour les chargements instantanés, pas de délai
    if (skipDelay) {
      setIsLoading(true);
      setOpacity(1); // Montrer immédiatement
      return;
    }

    // Démarrer le loader avec une légère opacité pour un retour visuel rapide
    setIsLoading(true);
    setOpacity(0.3); // Opacité initiale plus visible mais pas trop intrusive

    // Animation progressive vers une opacité complète
    fadeInTimerRef.current = setTimeout(() => {
      setOpacity(0.7);

      fadeInTimerRef.current = setTimeout(() => {
        setOpacity(1);
      }, 150);
    }, 50);
  };

  const hideLoader = () => {
    // Nettoyer les timers
    if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current);

    // Réinitialiser l'opacité
    setOpacity(0);

    // Masquer le loader
    setIsLoading(false);

    // Toujours réinitialiser le mode instantané après utilisation
    setSkipDelay(false);
  };

  const setInstantLoading = (state: boolean) => {
    setSkipDelay(state);
  };

  useEffect(() => {
    // Réinitialiser le loader lors des changements de chemin
    hideLoader();

    // Ajouter un délai de sécurité maximum pour tout loader
    const maxLoaderTimeout = setTimeout(() => {
      hideLoader();
    }, 8000); // 8 secondes maximum pour tout chargement

    return () => clearTimeout(maxLoaderTimeout);
  }, [pathname]);

  return (
    <GlobalLoaderContext.Provider
      value={{
        showLoader,
        showLoaderImmediately,
        hideLoader,
        isLoading,
        setInstantLoading,
      }}
    >
      {children}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: opacity }} // Animation contrôlée par l'état
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mb-4"></div>
              <p className="text-lg font-medium text-[color:var(--foreground)]">
                {message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlobalLoaderContext.Provider>
  );
}

// Composant autonome pour une utilisation simple
export const GlobalLoader = ({
  isVisible,
  message = "Chargement...",
}: {
  isVisible: boolean;
  message?: string;
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mb-4"></div>
            <p className="text-lg font-medium text-[color:var(--foreground)]">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
