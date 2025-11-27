// Fonctions pures pour le filtrage des tâches
import { Task, AgendaFilters } from "../types";

/**
 * Vérifie si une tâche correspond aux filtres
 */
export const taskMatchesFilters = (
  task: Task,
  filters: AgendaFilters,
  currentUserId: string
): boolean => {
  const { searchTerm, statusFilter, articleFilter, assigneeFilter } = filters;

  // Filtrer par texte de recherche
  const searchMatch =
    searchTerm === "" ||
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description &&
      task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    task.article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.article.sector.name.toLowerCase().includes(searchTerm.toLowerCase());

  // Filtrer par statut
  const statusMatch = statusFilter === "all" || task.status === statusFilter;

  // Filtrer par article
  const articleMatch =
    articleFilter === "all" || task.article.id === articleFilter;

  // Filtrer par assignation
  let assigneeMatch = true;
  if (assigneeFilter === "me" && currentUserId) {
    assigneeMatch = task.assignedToId === currentUserId;
  } else if (assigneeFilter === "all") {
    assigneeMatch = true;
  } else if (assigneeFilter !== "me") {
    assigneeMatch = task.assignedToId === assigneeFilter;
  }

  return searchMatch && statusMatch && articleMatch && assigneeMatch;
};

/**
 * Filtre les tâches et exclut les tâches terminées/annulées par défaut
 */
export const filterTasks = (
  tasks: Task[],
  filters: AgendaFilters,
  currentUserId: string
): Task[] => {
  return tasks.filter((task) => {
    // Exclure par défaut les tâches terminées et annulées,
    // sauf si l'utilisateur a explicitement demandé à les voir
    if (
      (task.status === "completed" || task.status === "cancelled") &&
      filters.statusFilter !== "completed" &&
      filters.statusFilter !== "cancelled"
    ) {
      return false;
    }

    return taskMatchesFilters(task, filters, currentUserId);
  });
};

/**
 * Obtient le badge variant selon le statut
 */
export const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case "pending":
      return "warning";
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

/**
 * Obtient le texte du statut
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case "pending":
      return "À faire";
    case "in_progress":
      return "En cours";
    case "completed":
      return "Terminée";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
};
