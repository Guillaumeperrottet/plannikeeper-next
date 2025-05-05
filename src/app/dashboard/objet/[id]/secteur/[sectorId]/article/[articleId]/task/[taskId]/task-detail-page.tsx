"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  MessageCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import DocumentsList from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/documents-list";
import DocumentUpload from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/document-upload";
import TaskComments from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/TaskComments";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
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
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
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
};

interface TaskDetailPageProps {
  task: Task;
  users: User[];
  objetId: string;
  sectorId: string;
  articleId: string;
}

export default function TaskDetailPage({
  task: initialTask,
  users,
  objetId,
  sectorId,
  articleId,
}: TaskDetailPageProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString();
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={18} />;
      case "in_progress":
        return <Clock size={18} className="text-blue-500" />;
      case "completed":
        return <CheckCircle2 size={18} className="text-green-500" />;
      case "cancelled":
        return <X size={18} className="text-red-500" />;
      default:
        return <AlertCircle size={18} />;
    }
  };

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedTask),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const updated = await response.json();
      setTask(updated);
      setIsEditing(false);
      toast.success("Tâche mise à jour avec succès");
    } catch {
      toast.error("Erreur lors de la mise à jour de la tâche");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Tâche supprimée avec succès");
      router.push(
        `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`
      );
    } catch {
      toast.error("Erreur lors de la suppression de la tâche");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const updated = await response.json();
      setTask(updated);
      toast.success("Statut mis à jour avec succès");
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header fixe pour mobile */}
      <div className="sticky top-0 z-10 bg-[color:var(--card)] border-b border-[color:var(--border)]">
        <div className="p-4 flex items-center justify-between">
          <Link
            href={`/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`}
            className="flex items-center gap-2 hover:text-[color:var(--primary)]"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Retour aux tâches</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hidden sm:flex"
                >
                  <Edit size={16} className="mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="sm:hidden"
                >
                  <Edit size={16} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  <X size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                  <Save size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Enregistrer</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* En-tête de la tâche */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
              style={{ backgroundColor: task.color || "var(--primary)" }}
            />
            {isEditing ? (
              <input
                type="text"
                value={editedTask.name}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, name: e.target.value })
                }
                className="text-2xl font-bold w-full bg-transparent border-b border-[color:var(--border)] focus:border-[color:var(--primary)] outline-none"
              />
            ) : (
              <h1 className="text-2xl font-bold">{task.name}</h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(task.status)}`}
            >
              {getStatusIcon(task.status)}
              <span>{getStatusName(task.status)}</span>
            </div>
            {task.taskType && (
              <div className="px-3 py-1 rounded-full text-sm bg-[color:var(--muted)]">
                {task.taskType}
              </div>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ""}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] min-h-[100px]"
                  placeholder="Ajouter une description..."
                />
              ) : (
                <div className="p-3 rounded-lg bg-[color:var(--muted)] min-h-[100px]">
                  {task.description || (
                    <span className="text-[color:var(--muted-foreground)]">
                      Aucune description
                    </span>
                  )}
                </div>
              )}
            </div>

            {task.executantComment && (
              <div>
                <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">
                  Commentaire d&apos;exécution
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.executantComment || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        executantComment: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] min-h-[80px]"
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-[color:var(--muted)] border-l-4 border-[color:var(--primary)]">
                    {task.executantComment}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">
                Date de réalisation
              </label>
              {isEditing ? (
                <div className="relative">
                  <input
                    type="date"
                    value={
                      editedTask.realizationDate
                        ? new Date(editedTask.realizationDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        realizationDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] pointer-events-none"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                  <Calendar size={16} />
                  <span>{formatDate(task.realizationDate)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">
                Assigné à
              </label>
              {isEditing ? (
                <select
                  value={editedTask.assignedToId || ""}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      assignedToId: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]"
                >
                  <option value="">Non assigné</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                  <User size={16} />
                  <span>{task.assignedTo?.name || "Non assigné"}</span>
                </div>
              )}
            </div>

            {task.recurring && (
              <div>
                <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">
                  Récurrence
                </label>
                <div className="flex items-center gap-2 text-[color:var(--foreground)]">
                  <Calendar size={16} />
                  <span>
                    {task.period === "daily" && "Quotidienne"}
                    {task.period === "weekly" && "Hebdomadaire"}
                    {task.period === "monthly" && "Mensuelle"}
                    {task.period === "quarterly" && "Trimestrielle"}
                    {task.period === "yearly" && "Annuelle"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        {!isEditing && (
          <div className="flex flex-wrap gap-2 mb-8">
            {task.status !== "completed" && (
              <Button
                onClick={() => handleStatusChange("completed")}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Marquer comme terminée
              </Button>
            )}
            {task.status === "completed" && (
              <Button
                onClick={() => handleStatusChange("pending")}
                disabled={isLoading}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Clock size={16} className="mr-2" />
                Rouvrir la tâche
              </Button>
            )}
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
              className="flex-1 sm:flex-none"
            >
              <Trash2 size={16} className="mr-2" />
              Supprimer
            </Button>
          </div>
        )}

        {/* Sections supplémentaires */}
        <div className="space-y-8">
          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Paperclip size={18} />
              Documents
            </h3>
            <DocumentsList taskId={task.id} onDocumentsChange={() => {}} />
            <div className="mt-4">
              <DocumentUpload taskId={task.id} onUploadSuccess={() => {}} />
            </div>
          </div>

          {/* Commentaires */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle size={18} />
              Discussion
            </h3>
            <TaskComments taskId={task.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
