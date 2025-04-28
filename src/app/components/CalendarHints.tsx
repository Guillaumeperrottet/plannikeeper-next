import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle, MousePointer, GripHorizontal, X } from "lucide-react";

const CalendarHints: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu les indications
    const hasSeenHints = localStorage.getItem("calendarHintsSeen");
    if (!hasSeenHints && !dismissed) {
      // Afficher les indications après un court délai
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    // Marquer comme vu dans le localStorage
    localStorage.setItem("calendarHintsSeen", "true");
  };

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-20 right-4 bg-card border border-border shadow-lg rounded-lg p-3 max-w-xs z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">Astuces du calendrier</h4>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <GripHorizontal size={16} className="text-primary" />
            <span>Tirez depuis la poignée pour agrandir le calendrier</span>
          </div>

          <div className="flex items-center gap-2">
            <MousePointer size={16} className="text-primary" />
            <span>Cliquez sur une tâche pour voir ses détails</span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpCircle size={16} className="text-primary" />
            <span>Cliquez sur "+" pour voir toutes les tâches d'un jour</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalendarHints;
