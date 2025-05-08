"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface GlobalLoaderContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
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

    // Ajouter les écouteurs (cette approche peut nécessiter une adaptation
    // selon la version de Next.js que vous utilisez)
    window.addEventListener("beforeunload", handleStart);

    // For Next.js App Router navigation events
    document.addEventListener("navigatestart", handleStart);
    document.addEventListener("navigatecomplete", handleComplete);

    // Nettoyer
    return () => {
      window.removeEventListener("beforeunload", handleStart);
      document.removeEventListener("navigatestart", handleStart);
      document.removeEventListener("navigatecomplete", handleComplete);
    };
  }, [router]);

  const showLoader = (customMessage?: string) => {
    setIsLoading(true);
    if (customMessage) {
      setMessage(customMessage);
    } else {
      setMessage("Chargement...");
    }
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoaderContext.Provider value={{ showLoader, hideLoader, isLoading }}>
      {children}

      <AnimatePresence>
        {isLoading && (
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
