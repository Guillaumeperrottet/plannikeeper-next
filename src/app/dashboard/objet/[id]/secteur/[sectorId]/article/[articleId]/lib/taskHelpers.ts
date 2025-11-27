import { Task } from "./types";

export const formatDate = (date: Date | null): string => {
  if (!date) return "Non définie";
  return new Date(date).toLocaleDateString("fr-FR");
};

export const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return {
        label: "À faire",
        variant: "pending" as const,
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    case "in_progress":
      return {
        label: "En cours",
        variant: "inProgress" as const,
        color: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "completed":
      return {
        label: "Terminée",
        variant: "completed" as const,
        color: "bg-green-100 text-green-700 border-green-200",
      };
    case "cancelled":
      return {
        label: "Annulée",
        variant: "cancelled" as const,
        color: "bg-gray-100 text-gray-700 border-gray-200",
      };
    default:
      return {
        label: status,
        variant: "pending" as const,
        color: "bg-gray-100 text-gray-700 border-gray-200",
      };
  }
};

export const getPeriodLabel = (period: string | null): string => {
  if (!period) return "";
  const labels: Record<string, string> = {
    daily: "Quotidienne",
    weekly: "Hebdomadaire",
    monthly: "Mensuelle",
    quarterly: "Trimestrielle",
    yearly: "Annuelle",
  };
  return labels[period] || period;
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("doc")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  return "📎";
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith("image/");
};

export const filterTasks = (
  tasks: Task[],
  searchQuery: string,
  activeFilter: string
): Task[] => {
  let result = [...tasks].filter((task) => !task.archived);

  // Apply status filter
  if (activeFilter !== "all") {
    result = result.filter((task) => task.status === activeFilter);
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (task) =>
        task.name.toLowerCase().includes(query) ||
        (task.description?.toLowerCase() || "").includes(query) ||
        (task.taskType?.toLowerCase() || "").includes(query) ||
        (task.assignedTo?.name.toLowerCase() || "").includes(query)
    );
  }

  return result;
};

export const sortTasks = (
  tasks: Task[],
  sortField: string | null,
  sortDirection: "asc" | "desc"
): Task[] => {
  if (!sortField) return tasks;

  return [...tasks].sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "assignedTo":
        aValue = a.assignedTo?.name.toLowerCase() || "";
        bValue = b.assignedTo?.name.toLowerCase() || "";
        break;
      case "taskType":
        aValue = a.taskType?.toLowerCase() || "";
        bValue = b.taskType?.toLowerCase() || "";
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "realizationDate":
        aValue = a.realizationDate ? new Date(a.realizationDate) : new Date(0);
        bValue = b.realizationDate ? new Date(b.realizationDate) : new Date(0);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
};

export const PREDEFINED_TASK_TYPES = ["Maintenance", "Entretien", "Réparation"];
