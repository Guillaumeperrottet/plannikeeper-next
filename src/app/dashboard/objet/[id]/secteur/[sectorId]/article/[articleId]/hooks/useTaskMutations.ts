"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Task } from "../lib/types";

interface UseTaskMutationsProps {
  articleId: string;
  onTasksChange: (updater: (tasks: Task[]) => Task[]) => void;
}

export function useTaskMutations({
  articleId,
  onTasksChange,
}: UseTaskMutationsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const createTask = async (
    taskData: Partial<Task>,
    documents?: File[]
  ): Promise<Task | null> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, articleId }),
      });

      if (!response.ok) throw new Error("Échec de la création");

      const newTask = await response.json();
      onTasksChange((tasks) => [newTask, ...tasks]);
      toast.success("Tâche créée avec succès");

      // Upload documents in background
      if (documents && documents.length > 0) {
        uploadDocuments(newTask.id, documents);
      }

      return newTask;
    } catch (error) {
      console.error("Erreur création tâche:", error);
      toast.error("Échec de la création de la tâche");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (
    taskId: string,
    updates: Partial<Task>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour");

      const updatedTask = await response.json();
      onTasksChange((tasks) =>
        tasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      toast.success("Tâche mise à jour avec succès");
      return true;
    } catch (error) {
      console.error("Erreur mise à jour tâche:", error);
      toast.error("Échec de la mise à jour de la tâche");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?"))
      return false;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression");

      onTasksChange((tasks) => tasks.filter((task) => task.id !== taskId));
      toast.success("Tâche supprimée avec succès");
      return true;
    } catch (error) {
      console.error("Erreur suppression tâche:", error);
      toast.error("Échec de la suppression de la tâche");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const archiveTask = async (taskId: string): Promise<boolean> => {
    if (!confirm("Êtes-vous sûr de vouloir archiver cette tâche ?"))
      return false;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) throw new Error("Échec de l'archivage");

      onTasksChange((tasks) => tasks.filter((task) => task.id !== taskId));
      toast.success("Tâche archivée avec succès");
      return true;
    } catch (error) {
      console.error("Erreur archivage tâche:", error);
      toast.error("Échec de l'archivage de la tâche");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changeStatus = async (
    taskId: string,
    newStatus: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour du statut");

      const updatedTask = await response.json();
      onTasksChange((tasks) =>
        tasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      toast.success("Statut mis à jour avec succès");
      return true;
    } catch (error) {
      console.error("Erreur changement statut:", error);
      toast.error("Échec de la mise à jour du statut");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocuments = async (taskId: string, files: File[]) => {
    toast.info(`Upload de ${files.length} document(s) en cours...`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error("Erreur upload document:", error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`${successCount} document(s) uploadé(s) avec succès`);
    } else {
      toast.warning(`${successCount} uploadé(s), ${errorCount} échec(s)`);
    }

    // Refresh task to get updated documents
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const updatedTask = await response.json();
        onTasksChange((tasks) =>
          tasks.map((task) => (task.id === taskId ? updatedTask : task))
        );
      }
    } catch (error) {
      console.error("Erreur refresh tâche:", error);
    }
  };

  return {
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    changeStatus,
    uploadDocuments,
  };
}
