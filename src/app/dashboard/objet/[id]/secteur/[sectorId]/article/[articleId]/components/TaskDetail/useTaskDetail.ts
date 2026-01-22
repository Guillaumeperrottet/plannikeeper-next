"use client";

import { useState } from "react";
import { Task } from "../../lib/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseTaskDetailProps {
  initialTask: Task;
  readonly?: boolean;
}

export function useTaskDetail({
  initialTask,
  readonly = false,
}: UseTaskDetailProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false && !readonly);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>(task);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTask(task);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask(task);
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
    } catch (error) {
      console.error("Erreur:", error);
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

      // Redirect back to article after deletion
      if (task.article) {
        const articleUrl = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}`;
        router.push(articleUrl);
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression de la tâche");
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

      // Optimistic UI update avec animation
      setTask((prev) => ({
        ...prev,
        status: newStatus,
        done: newStatus === "completed",
      }));
      setTimeout(() => setTask(updated), 100);

      // Toast amélioré quand une tâche est marquée "completed"
      if (newStatus === "completed") {
        toast.success("Tâche terminée ! Auto-archivage dans 24h", {
          duration: 8000,
          action: {
            label: "Archiver maintenant",
            onClick: async () => {
              try {
                const archiveResponse = await fetch(
                  `/api/tasks/${task.id}/archive`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ archive: true }),
                  },
                );

                if (archiveResponse.ok) {
                  toast.success("Tâche archivée immédiatement");
                  // Rediriger vers l'article
                  if (task.article) {
                    const articleUrl = `/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}`;
                    router.push(articleUrl);
                  }
                }
              } catch (error) {
                console.error("Erreur archivage:", error);
                toast.error("Erreur lors de l'archivage");
              }
            },
          },
          cancel: {
            label: "Annuler",
            onClick: async () => {
              try {
                const cancelResponse = await fetch(`/api/tasks/${task.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "pending" }),
                });

                if (cancelResponse.ok) {
                  const revertedTask = await cancelResponse.json();
                  setTask(revertedTask);
                  toast.info("Tâche remise en attente");
                }
              } catch (error) {
                console.error("Erreur annulation:", error);
                toast.error("Erreur lors de l'annulation");
              }
            },
          },
        });
      } else {
        toast.success("Statut mis à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsLoading(false);
    }
  };

  const updateEditedTask = (updates: Partial<Task>) => {
    setEditedTask((prev) => ({ ...prev, ...updates }));
  };

  // New: Direct update function for inline editing
  const handleUpdate = async (updates: Partial<Task>) => {
    // Optimistic UI update
    setTask((prev) => ({ ...prev, ...updates }));

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...task, ...updates }),
      });

      if (!response.ok) {
        // Revert on error
        setTask((prev) => prev);
        throw new Error("Erreur lors de la mise à jour");
      }

      const updated = await response.json();
      setTask(updated);
    } catch (error) {
      console.error("Erreur:", error);
      throw error; // Re-throw to let the caller handle it
    } finally {
      setIsLoading(false);
    }
  };

  return {
    task,
    isEditing,
    isLoading,
    editedTask,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
    handleStatusChange,
    handleUpdate,
    updateEditedTask,
  };
}
