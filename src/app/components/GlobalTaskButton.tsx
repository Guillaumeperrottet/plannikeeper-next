"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { QuickTaskDialog } from "./QuickTaskDialog";

/**
 * Bouton flottant global pour créer une tâche depuis n'importe où
 * Toujours visible en bas à droite de l'écran
 */
export function GlobalTaskButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - positionné au-dessus du bouton agenda sur mobile */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 md:bottom-24 md:right-6 h-12 w-12 md:h-16 md:w-16 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
        aria-label="Créer une tâche rapide"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
      </Button>

      {/* Dialog de création de tâche */}
      <QuickTaskDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
