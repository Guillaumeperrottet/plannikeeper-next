import React from "react";
import {
  X,
  Calendar,
  User,
  Tag,
  Clock,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

type Task = {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  realizationDate: Date | null;
  status: string;
  taskType: string | null;
  color: string | null;
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
  assignedTo?: {
    id: string;
    name: string;
  } | null;
};

type TaskDetailPopupProps = {
  task: Task;
  onClose: () => void;
  onNavigate: (taskId: string) => void;
};

const TaskDetailPopup: React.FC<TaskDetailPopupProps> = ({
  task,
  onClose,
  onNavigate,
}) => {
  // Formatage de date
  const formatDate = (date: Date | null): string => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString();
  };

  // Status badge avec sa couleur appropriée
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[color:var(--warning-background)] text-[color:var(--warning-foreground)] border-[color:var(--warning-border)]";
      case "in_progress":
        return "bg-[color:var(--info-background)] text-[color:var(--info-foreground)] border-[color:var(--info-border)]";
      case "completed":
        return "bg-[color:var(--success-background)] text-[color:var(--success-foreground)] border-[color:var(--success-border)]";
      case "cancelled":
        return "bg-[color:var(--destructive-background)] text-[color:var(--destructive-foreground)] border-[color:var(--destructive-border)]";
      default:
        return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]";
    }
  };

  // Nom du statut
  const getStatusName = (status: string) => {
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

  // Icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={14} />;
      case "cancelled":
        return <CircleOff size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">{task.name}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <div
            className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusIcon(task.status)}
            <span>{getStatusName(task.status)}</span>
          </div>

          {task.taskType && (
            <div className="px-2 py-0.5 text-xs rounded-full bg-muted text-foreground flex items-center gap-1">
              <Tag size={10} />
              <span>{task.taskType}</span>
            </div>
          )}
        </div>

        {task.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase mb-1">
              Description
            </h4>
            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
              {task.description}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Échéance
            </h4>
            <div className="flex items-center gap-1 text-sm">
              <Calendar size={14} />
              <span>{formatDate(task.realizationDate)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Assigné à
            </h4>
            <div className="flex items-center gap-1 text-sm">
              <User size={14} />
              <span>{task.assignedTo?.name || "Non assigné"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Localisation
          </h4>
          <div className="text-sm bg-muted p-2 rounded-md">
            <div>{task.article.sector.object.nom}</div>
            <div>
              {task.article.sector.name} / {task.article.title}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3 flex justify-end">
          <button
            onClick={() => onNavigate(task.id)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
          >
            Voir détails complets
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPopup;
