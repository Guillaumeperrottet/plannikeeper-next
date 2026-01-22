"use client";

import { useEffect, useRef } from "react";
import { TodoListAgendaContainer } from "./TodoListAgenda/TodoListAgendaContainer";

interface AgendaControllerProps {
  onRefresh: () => Promise<void>;
  refreshKey: number;
  updateTaskDate: (taskId: string, newDate: Date) => Promise<void>;
  isMobile: boolean;
  initialSelectedObjectId: string | null;
}

/**
 * Controller pour l'Agenda - Expose la fonction toggleExpanded
 */
export function AgendaController({
  onRefresh,
  refreshKey,
  updateTaskDate,
  isMobile,
  initialSelectedObjectId,
}: AgendaControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Exposer une fonction pour déclencher le toggle de l'agenda
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __toggleAgenda?: () => void }).__toggleAgenda =
        () => {
          // Déclencher un clic sur le header de l'agenda pour l'ouvrir
          const agendaHeader = document.querySelector(
            "[data-todo-list-agenda] [data-agenda-header]",
          );
          if (agendaHeader) {
            (agendaHeader as HTMLElement).click();
          }
        };
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as Window & { __toggleAgenda?: () => void })
          .__toggleAgenda;
      }
    };
  }, []);

  return (
    <div ref={containerRef}>
      <TodoListAgendaContainer
        onRefresh={onRefresh}
        refreshKey={refreshKey}
        updateTaskDate={updateTaskDate}
        isMobile={isMobile}
        initialSelectedObjectId={initialSelectedObjectId}
      />
    </div>
  );
}
