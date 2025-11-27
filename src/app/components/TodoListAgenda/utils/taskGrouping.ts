// Fonctions pour regrouper les tâches
import { Task, GroupedTasks } from "../types";
import { isThisWeek } from "./dateHelpers";

/**
 * Regroupe les tâches en "Cette semaine" et "À venir"
 */
export const groupTasksByWeek = (tasks: Task[]): GroupedTasks => {
  const thisWeek: Task[] = [];
  const upcoming: Task[] = [];

  tasks.forEach((task) => {
    if (!task.realizationDate || isThisWeek(task.realizationDate)) {
      thisWeek.push(task);
    } else {
      upcoming.push(task);
    }
  });

  return { thisWeek, upcoming };
};

/**
 * Regroupe les tâches par jour pour le calendrier
 */
export const groupTasksByDay = (tasks: Task[]): Record<string, Task[]> => {
  const taskMap: Record<string, Task[]> = {};

  tasks.forEach((task) => {
    if (task.realizationDate) {
      const date = task.realizationDate;
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      if (!taskMap[dateKey]) {
        taskMap[dateKey] = [];
      }
      taskMap[dateKey].push(task);
    }
  });

  return taskMap;
};
