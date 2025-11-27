// Contenu principal de l'agenda
"use client";

import dynamic from "next/dynamic";
import { ViewMode, Task, AgendaFilters } from "../../types";
import { ListView } from "./ListView";

// Import dynamique de CalendarView
const CalendarView = dynamic(() => import("@/app/components/CalendarView"), {
  ssr: false,
});

interface AgendaContentProps {
  viewMode: ViewMode;
  tasks: Task[];
  filters: AgendaFilters;
  isLoading: boolean;
  isMobile: boolean;
  refreshKey: number;
  updateTaskDate?: (taskId: string, newDate: Date) => Promise<void>;
  onTaskClick: (task: Task) => Promise<void>;
  showControls: boolean;
  showFiltersPanel: boolean;
}

export const AgendaContent = ({
  viewMode,
  tasks,
  filters,
  isLoading,
  isMobile,
  refreshKey,
  updateTaskDate,
  onTaskClick,
  showControls,
  showFiltersPanel,
}: AgendaContentProps) => {
  // Calculer la hauteur dynamique du contenu
  const getContentHeight = () => {
    const baseHeight = 48; // Header
    if (!showControls) return `calc(100% - ${baseHeight}px)`;

    const controlsHeight =
      viewMode === ViewMode.LIST ? (showFiltersPanel ? 110 : 58) : 58;

    return `calc(100% - ${baseHeight + controlsHeight}px)`;
  };

  return (
    <div
      className="overflow-y-auto agenda-content"
      style={{ height: getContentHeight() }}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Chargement des tâches...</p>
        </div>
      ) : viewMode === ViewMode.CALENDAR ? (
        <CalendarView
          tasks={tasks}
          navigateToTask={onTaskClick}
          refreshKey={refreshKey}
          updateTaskDate={updateTaskDate}
          isMobile={isMobile}
        />
      ) : (
        <ListView
          tasks={tasks}
          filters={filters}
          onTaskClick={onTaskClick}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};
