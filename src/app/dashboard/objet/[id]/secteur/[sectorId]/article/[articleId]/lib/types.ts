export type User = {
  id: string;
  name: string;
  email: string;
};

export type TaskDocument = {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
};

export type Task = {
  id: string;
  name: string;
  description: string | null;
  executantComment: string | null;
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
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
  archivedAt?: Date | null;
  completedAt?: Date | null;
  documents?: TaskDocument[];
  article?: {
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
};

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskFilter = "all" | TaskStatus;

export type SortField =
  | "name"
  | "status"
  | "assignedTo"
  | "taskType"
  | "createdAt"
  | "realizationDate";

export type SortDirection = "asc" | "desc";
