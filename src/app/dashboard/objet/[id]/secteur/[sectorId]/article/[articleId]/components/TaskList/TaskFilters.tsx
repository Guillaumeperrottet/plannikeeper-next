"use client";

import { TaskFilter } from "../../lib/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Search, X, Plus } from "lucide-react";
import ArchiveCompletedButton from "../../ArchiveCompletedButton";
import { Task } from "../../lib/types";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  resultCount: number;
  onNewTask: () => void;
  completedTasks?: Task[];
  onArchiveCompleted?: () => void;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  resultCount,
  onNewTask,
  completedTasks,
  onArchiveCompleted,
}: TaskFiltersProps) {
  const filters: { value: TaskFilter; label: string }[] = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "À faire" },
    { value: "in_progress", label: "En cours" },
    { value: "completed", label: "Terminées" },
    { value: "cancelled", label: "Annulées" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and New Task Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button onClick={onNewTask} className="gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle tâche</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === filter.value
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {filter.label}
          </button>
        ))}

        {/* Archive Completed Button */}
        {completedTasks && completedTasks.length > 0 && onArchiveCompleted && (
          <div className="ml-auto pl-4 border-l border-gray-300">
            <ArchiveCompletedButton
              completedTasks={completedTasks}
              onArchiveCompleted={onArchiveCompleted}
            />
          </div>
        )}

        {/* Result Count */}
        <div className="ml-auto text-sm text-gray-500 whitespace-nowrap">
          {resultCount} résultat{resultCount > 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
