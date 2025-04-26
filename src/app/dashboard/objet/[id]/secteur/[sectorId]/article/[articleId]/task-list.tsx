"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Calendar,
  User,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import TaskForm from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task-form";

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
  recurrenceReminderDate: Date | null;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function TaskList({
  tasks,
  users,
  articleId,
}: {
  tasks: Task[];
  users: User[];
  articleId: string;
}) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "in_progress":
        return <Clock size={16} className="text-blue-500" />;
      case "completed":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "cancelled":
        return <CircleDashed size={16} className="text-red-500" />;
      default:
        return <CircleDashed size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Non spécifiée";
    return new Date(date).toLocaleDateString();
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la tâche");
      }

      toast.success("Tâche supprimée avec succès");
      // Rafraîchir la page pour actualiser la liste des tâches
      window.location.reload();
    } catch (error) {
      toast.error("Erreur lors de la suppression: " + (error as Error).message);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      toast.success("Statut mis à jour avec succès");
      // Rafraîchir la page pour actualiser la liste des tâches
      window.location.reload();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour: " + (error as Error).message);
    }
  };

  if (editingTaskId) {
    const taskToEdit = tasks.find((t) => t.id === editingTaskId);
    if (!taskToEdit) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-bold mb-4">Modifier la tâche</h3>
        <TaskForm
          articleId={articleId}
          users={users}
          task={taskToEdit}
          onCancel={() => setEditingTaskId(null)}
        />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">
          Aucune tâche n&apos;a été créée pour cet article.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`p-4 border rounded-lg ${
            task.done ? "bg-green-50 border-green-200" : "bg-backgroundround"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{task.name}</h3>

              {task.description && (
                <p className="text-gray-600 mt-2 mb-4">{task.description}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(
                    task.status
                  )}`}
                >
                  {getStatusIcon(task.status)}
                  <span className="capitalize">
                    {task.status === "pending"
                      ? "À faire"
                      : task.status === "in_progress"
                      ? "En cours"
                      : task.status === "completed"
                      ? "Terminée"
                      : task.status === "cancelled"
                      ? "Annulée"
                      : task.status}
                  </span>
                </span>

                {task.realizationDate && (
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-xs flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(task.realizationDate)}
                  </span>
                )}

                {task.assignedTo && (
                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-800 text-xs flex items-center gap-1">
                    <User size={12} />
                    {task.assignedTo.name}
                  </span>
                )}

                {task.recurring && (
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                    Récurrente
                  </span>
                )}
              </div>

              {task.executantComment && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">Commentaire :</p>
                  <p>{task.executantComment}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              {!task.done && (
                <button
                  onClick={() => handleTaskStatusChange(task.id, "completed")}
                  className="p-2 rounded-full hover:bg-green-100 text-green-600"
                  title="Marquer comme terminée"
                >
                  <Check size={16} />
                </button>
              )}

              <button
                onClick={() => setEditingTaskId(task.id)}
                className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                title="Modifier la tâche"
              >
                <Edit size={16} />
              </button>

              <button
                onClick={() => handleTaskDelete(task.id)}
                className="p-2 rounded-full hover:bg-red-100 text-red-600"
                title="Supprimer la tâche"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t text-xs text-gray-500">
            Créée le {formatDate(task.createdAt)} • Dernière mise à jour:{" "}
            {formatDate(task.updatedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
