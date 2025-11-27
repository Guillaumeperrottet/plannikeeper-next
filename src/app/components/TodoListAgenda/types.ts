// Types centralisés pour l'agenda Todo List

export interface Task {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  realizationDate: Date | null;
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
  recurrenceReminderDate: Date | null;
  assignedToId: string | null;
  article: {
    id: string;
    title: string;
    sector: {
      id: string;
      name: string;
      object: {
        id: string;
        nom: string;
      };
    };
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RawTask
  extends Omit<
    Task,
    | "realizationDate"
    | "recurrenceReminderDate"
    | "endDate"
    | "createdAt"
    | "updatedAt"
  > {
  realizationDate: string | null;
  recurrenceReminderDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppObject {
  id: string;
  nom: string;
}

export interface ArticleOption {
  id: string;
  title: string;
  sectorName: string;
}

export interface AssignableUser {
  id: string;
  name: string;
}

export enum ViewMode {
  LIST = "list",
  CALENDAR = "calendar",
}

export interface AgendaFilters {
  searchTerm: string;
  statusFilter: string;
  articleFilter: string;
  assigneeFilter: string;
}

export interface AgendaState {
  isExpanded: boolean;
  agendaHeight: number;
  viewMode: ViewMode;
  showControls: boolean;
  showFiltersPanel: boolean;
  interactionLocked: boolean;
  showDragHint: boolean;
  isRefreshingLocal: boolean;
}

export interface AgendaDimensions {
  minHeight: number;
  maxHeight: number;
  isPWA: boolean;
  isMobile: boolean;
}

export interface TodoListAgendaProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshKey?: number;
  updateTaskDate?: (taskId: string, newDate: Date) => Promise<void>;
  isMobile?: boolean;
  initialSelectedObjectId?: string | null;
}

export interface GroupedTasks {
  thisWeek: Task[];
  upcoming: Task[];
}
