"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Réinitialisez l'état de chargement lorsque le chemin ou les paramètres de recherche changent
  useEffect(() => {
    setIsLoading(true);

    // Configurer un timeout pour désactiver le loader si la navigation prend trop de temps
    // (évite que le loader reste bloqué en cas de problème)
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 secondes maximum

    setLoadingTimeout(timeout);

    // Une fois que le rendu est terminé, nous pouvons masquer le loader
    const hideLoader = () => {
      // Petite temporisation pour laisser le temps au DOM de se mettre à jour
      setTimeout(() => {
        setIsLoading(false);
        if (loadingTimeout) clearTimeout(loadingTimeout);
      }, 300);
    };

    // Utiliser requestAnimationFrame pour s'assurer que le navigateur a eu le temps de rendre la page
    requestAnimationFrame(() => {
      requestAnimationFrame(hideLoader);
    });

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mb-4"></div>
            <p className="text-lg font-medium text-[color:var(--foreground)]">
              Chargement en cours...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
