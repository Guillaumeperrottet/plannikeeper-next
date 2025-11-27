// Hook pour gérer les filtres de l'agenda
"use client";

import { useState, useMemo } from "react";
import { Task, AgendaFilters, ArticleOption, AssignableUser } from "../types";
import { filterTasks } from "../utils/taskFilters";

export const useAgendaFilters = (tasks: Task[], currentUserId: string) => {
  const [filters, setFilters] = useState<AgendaFilters>({
    searchTerm: "",
    statusFilter: "all",
    articleFilter: "all",
    assigneeFilter: "me",
  });

  // Extraire les articles disponibles pour le filtre (mémoïsé)
  const availableArticles = useMemo<ArticleOption[]>(() => {
    const articlesMap = new Map<string, ArticleOption>();
    tasks.forEach((task) => {
      if (!articlesMap.has(task.article.id)) {
        articlesMap.set(task.article.id, {
          id: task.article.id,
          title: task.article.title,
          sectorName: task.article.sector.name,
        });
      }
    });
    return Array.from(articlesMap.values());
  }, [tasks]);

  // Extraire les utilisateurs assignables pour le filtre (mémoïsé)
  const assignableUsers = useMemo<AssignableUser[]>(() => {
    const usersMap = new Map<string, AssignableUser>();
    tasks.forEach((task) => {
      if (task.assignedTo && !usersMap.has(task.assignedTo.id)) {
        // Ne pas ajouter l'utilisateur courant car on a déjà "Mes tâches"
        if (task.assignedTo.id !== currentUserId) {
          usersMap.set(task.assignedTo.id, {
            id: task.assignedTo.id,
            name: task.assignedTo.name,
          });
        }
      }
    });
    return Array.from(usersMap.values());
  }, [tasks, currentUserId]);

  // Filtrer les tâches (mémoïsé)
  const filteredTasks = useMemo<Task[]>(() => {
    return filterTasks(tasks, filters, currentUserId);
  }, [tasks, filters, currentUserId]);

  const updateFilter = <K extends keyof AgendaFilters>(
    key: K,
    value: AgendaFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearSearchTerm = () => {
    setFilters((prev) => ({ ...prev, searchTerm: "" }));
  };

  return {
    filters,
    filteredTasks,
    availableArticles,
    assignableUsers,
    updateFilter,
    clearSearchTerm,
  };
};
