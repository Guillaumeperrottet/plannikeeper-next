// Panneau de filtres avancés
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchIcon, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { AgendaFilters, ArticleOption } from "../../types";

interface FilterPanelProps {
  isOpen: boolean;
  filters: AgendaFilters;
  onFilterChange: <K extends keyof AgendaFilters>(
    key: K,
    value: AgendaFilters[K]
  ) => void;
  onClearSearch: () => void;
  availableArticles: ArticleOption[];
}

export const FilterPanel = ({
  isOpen,
  filters,
  onFilterChange,
  onClearSearch,
  availableArticles,
}: FilterPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-2 space-y-2"
        >
          {/* Recherche compacte */}
          <div className="relative">
            <SearchIcon
              size={12}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange("searchTerm", e.target.value)}
              className="w-full h-7 pl-7 pr-7 text-xs rounded-full"
            />
            {filters.searchTerm && (
              <Button
                onClick={onClearSearch}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          {/* Filtres sur une ligne */}
          <div className="flex gap-2">
            <select
              value={filters.statusFilter}
              onChange={(e) => onFilterChange("statusFilter", e.target.value)}
              className="flex-1 bg-background px-2 py-1.5 rounded-full border border-border text-xs"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
            <select
              value={filters.articleFilter}
              onChange={(e) => onFilterChange("articleFilter", e.target.value)}
              className="flex-1 bg-background px-2 py-1.5 rounded-full border border-border text-xs"
            >
              <option value="all">Tous articles</option>
              {availableArticles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title.length > 15
                    ? `${article.title.substring(0, 15)}...`
                    : article.title}
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
