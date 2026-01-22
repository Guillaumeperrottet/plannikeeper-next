"use client";

import { useState } from "react";
import { Calendar, CheckSquare } from "lucide-react";
import { SpeedDial, SpeedDialAction } from "./SpeedDial";
import { QuickTaskDialog } from "./QuickTaskDialog";

/**
 * Speed Dial Menu pour mobile - Regroupe les actions rapides
 * Remplace les FABs individuels pour une UI plus épurée
 */
export function MobileSpeedDial() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const handleOpenAgenda = () => {
    // Utiliser la fonction exposée par AgendaController
    if (typeof window !== "undefined") {
      const toggleAgenda = (window as Window & { __toggleAgenda?: () => void })
        .__toggleAgenda;
      if (toggleAgenda) {
        toggleAgenda();
      }
    }
  };

  const actions: SpeedDialAction[] = [
    {
      icon: <Calendar className="h-5 w-5 text-foreground" />,
      label: "Ouvrir l'agenda",
      onClick: handleOpenAgenda,
    },
    {
      icon: <CheckSquare className="h-5 w-5 text-foreground" />,
      label: "Créer une tâche",
      onClick: () => setIsTaskDialogOpen(true),
    },
  ];

  return (
    <>
      <div className="md:hidden">
        <SpeedDial actions={actions} />
      </div>

      {/* Dialog de création de tâche */}
      <QuickTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
      />
    </>
  );
}
