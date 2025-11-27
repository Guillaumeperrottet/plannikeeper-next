// Bouton flottant pour ouvrir l'agenda sur mobile
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface AgendaFloatingButtonProps {
  isExpanded: boolean;
  isMobile: boolean;
  onToggle: () => void;
}

export const AgendaFloatingButton = ({
  isExpanded,
  isMobile,
  onToggle,
}: AgendaFloatingButtonProps) => {
  if (isExpanded || !isMobile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 z-50"
      >
        <button
          onClick={onToggle}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(168, 162, 158, 0.6)",
            color: "#57534e",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          aria-label="Ouvrir l'agenda"
        >
          <ArrowUp size={20} color="#57534e" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
