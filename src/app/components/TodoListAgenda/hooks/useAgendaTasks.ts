// Hook pour gérer les tâches de l'agenda
"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, RawTask, AppObject } from "../types";
import { normalizeDate } from "../utils/dateHelpers";

export const useAgendaTasks = (
  initialSelectedObjectId: string | null,
  refreshKey: number,
) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<AppObject[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedObjectId || "",
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // CRITIQUE : Synchroniser avec initialSelectedObjectId quand il change depuis le Wrapper
  useEffect(() => {
    if (initialSelectedObjectId && initialSelectedObjectId !== selectedId) {
      setSelectedId(initialSelectedObjectId);
    }
  }, [initialSelectedObjectId, selectedId]);

  // Récupération des objets
  useEffect(() => {
    const fetchObjects = async (): Promise<void> => {
      try {
        const response = await fetch("/api/objet");
        if (response.ok) {
          const data: AppObject[] = await response.json();
          setObjects(data);
          if (data.length > 0 && !selectedId) {
            setSelectedId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des objets :", error);
      }
    };
    fetchObjects();
  }, [selectedId]);

  // Récupération des tâches
  useEffect(() => {
    const fetchTasks = async (): Promise<void> => {
      if (!selectedId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tasks/object/${selectedId}`);
        if (response.ok) {
          const data = await response.json();
          const tasksWithDateObjects: Task[] = data.map((task: RawTask) => ({
            ...task,
            realizationDate: normalizeDate(task.realizationDate),
            recurrenceReminderDate: normalizeDate(task.recurrenceReminderDate),
            endDate: normalizeDate(task.endDate),
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            assignedToId: task.assignedToId || null,
          }));
          setTasks(tasksWithDateObjects);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tâches :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [selectedId, refreshKey]);

  const changeObject = useCallback((objectId: string) => {
    setSelectedId(objectId);
  }, []);

  return {
    tasks,
    objects,
    selectedObjectId: selectedId,
    isLoading,
    changeObject,
  };
};
