// Barre de contrôles complète
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Filter, RefreshCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ViewModeToggle } from "./ViewModeToggle";
import { QuickFilters } from "./QuickFilters";
import { FilterPanel } from "./FilterPanel";
import {
  ViewMode,
  AgendaFilters,
  AssignableUser,
  ArticleOption,
} from "../../types";

interface AgendaControlsProps {
  isExpanded: boolean;
  showControls: boolean;
  showFiltersPanel: boolean;
  viewMode: ViewMode;
  filters: AgendaFilters;
  assignableUsers: AssignableUser[];
  availableArticles: ArticleOption[];
  isMobile: boolean;
  showDragHint: boolean;
  isRefreshing: boolean;
  updateTaskDate?: (taskId: string, newDate: Date) => Promise<void>;
  onViewModeToggle: () => void;
  onFilterChange: <K extends keyof AgendaFilters>(
    key: K,
    value: AgendaFilters[K]
  ) => void;
  onClearSearch: () => void;
  onToggleFiltersPanel: () => void;
  onRefresh?: () => void;
}

export const AgendaControls = ({
  isExpanded,
  showControls,
  showFiltersPanel,
  viewMode,
  filters,
  assignableUsers,
  availableArticles,
  isMobile,
  showDragHint,
  isRefreshing,
  updateTaskDate,
  onViewModeToggle,
  onFilterChange,
  onClearSearch,
  onToggleFiltersPanel,
  onRefresh,
}: AgendaControlsProps) => {
  if (!isExpanded || !showControls) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-muted border-b border-border"
      >
        {/* Ligne principale compacte */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Contrôles de vue (gauche) */}
          <ViewModeToggle
            viewMode={viewMode}
            onToggle={onViewModeToggle}
            isMobile={isMobile}
          />

          {/* Filtre d'assignation (centre) */}
          <QuickFilters
            assigneeFilter={filters.assigneeFilter}
            onAssigneeFilterChange={(filter) =>
              onFilterChange("assigneeFilter", filter)
            }
            assignableUsers={assignableUsers}
          />

          {/* Actions (droite) */}
          <div className="flex items-center gap-1">
            {viewMode === ViewMode.LIST && (
              <Button
                onClick={onToggleFiltersPanel}
                variant={showFiltersPanel ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
              >
                <Filter size={14} />
              </Button>
            )}
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={isRefreshing}
              >
                <RefreshCcw
                  size={14}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </Button>
            )}
          </div>
        </div>

        {/* Panneau de filtres */}
        {viewMode === ViewMode.LIST && (
          <FilterPanel
            isOpen={showFiltersPanel}
            filters={filters}
            onFilterChange={onFilterChange}
            onClearSearch={onClearSearch}
            availableArticles={availableArticles}
          />
        )}

        {/* Hint drag and drop */}
        {showDragHint &&
          viewMode === ViewMode.CALENDAR &&
          !isMobile &&
          updateTaskDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs text-muted-foreground py-1"
            >
              💡 Glissez les tâches pour changer leur date
            </motion.div>
          )}
      </motion.div>
    </AnimatePresence>
  );
};
