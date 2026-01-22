"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SpeedDialAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface SpeedDialProps {
  actions: SpeedDialAction[];
  className?: string;
}

export function SpeedDial({ actions, className = "" }: SpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleActionClick = (action: SpeedDialAction) => {
    action.onClick();
    setIsOpen(false);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Fermer automatiquement au scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      setIsOpen(false);
    };

    // Écouter le scroll sur la fenêtre et tous les conteneurs scrollables
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isOpen]);

  return (
    <TooltipProvider>
      <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
        {/* Backdrop overlay quand ouvert */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Actions (en éventail) */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-0 right-0 flex flex-col-reverse gap-3 pb-20">
              {actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, y: 20, opacity: 0 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1,
                  }}
                  exit={{
                    scale: 0,
                    y: 20,
                    opacity: 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  className="flex items-center gap-3 justify-end"
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className="bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border text-sm font-medium whitespace-nowrap"
                  >
                    {action.label}
                  </motion.span>

                  {/* Action Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleActionClick(action)}
                        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                          action.color || "bg-background hover:bg-accent"
                        } border border-border`}
                      >
                        {action.icon}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleOpen}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl transition-shadow flex items-center justify-center relative overflow-hidden"
              aria-label={
                isOpen ? "Fermer le menu" : "Ouvrir le menu d'actions"
              }
            >
              {/* Gradient overlay subtil */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

              {/* Icon avec rotation */}
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {isOpen ? (
                  <X className="h-6 w-6 relative z-10" />
                ) : (
                  <Plus className="h-6 w-6 relative z-10" />
                )}
              </motion.div>

              {/* Ripple effect au clic */}
              {isOpen && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-primary-foreground rounded-full"
                />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? "Fermer" : "Actions rapides"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
