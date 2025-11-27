// Vue liste optimisée des tâches
"use client";

import { useMemo } from "react";
import { Task, AgendaFilters } from "../../types";
import { TaskCard } from "./TaskCard";
import { groupTasksByWeek } from "../../utils/taskGrouping";

interface ListViewProps {
  tasks: Task[];
  filters: AgendaFilters;
  onTaskClick: (task: Task) => Promise<void>;
  isMobile: boolean;
}

export const ListView = ({
  tasks,
  filters,
  onTaskClick,
  isMobile,
}: ListViewProps) => {
  // Regrouper les tâches (mémoïsé)
  const { thisWeek, upcoming } = useMemo(() => {
    return groupTasksByWeek(tasks);
  }, [tasks]);

  const hasActiveFilters =
    filters.searchTerm !== "" ||
    filters.statusFilter !== "all" ||
    filters.articleFilter !== "all" ||
    filters.assigneeFilter !== "all";

  const emptyMessage = hasActiveFilters
    ? "Aucune tâche ne correspond à vos critères de recherche."
    : "Aucune tâche.";

  return (
    <div
      className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2"} gap-4 p-4`}
    >
      {/* Cette semaine */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground sticky top-0 bg-background py-2 z-10">
          Cette semaine
        </h3>
        {thisWeek.length === 0 ? (
          <p className="text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-2 pb-4">
            {thisWeek.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </ul>
        )}
      </div>

      {/* À venir */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground sticky top-0 bg-background py-2 z-10">
          À venir
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-2 pb-4">
            {upcoming.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
