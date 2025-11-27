"use client";

import { useState } from "react";
import { Task, User } from "./lib/types";
import { TaskList } from "./components/TaskList/TaskList";
import { TaskForm } from "./components/TaskForm/TaskForm";
import { useTaskMutations } from "./hooks/useTaskMutations";

interface TasksPageClientProps {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
}

export default function TasksPageClient({
  initialTasks,
  users,
  articleId,
  articleTitle,
  articleDescription,
  objetId,
  sectorId,
}: TasksPageClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  const { createTask, updateTask } = useTaskMutations({
    articleId,
    onTasksChange: setTasks,
  });

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  const handleSaveTask = async (
    taskData: Partial<Task>,
    documents?: File[]
  ) => {
    if (selectedTask?.id) {
      await updateTask(selectedTask.id, taskData);
    } else {
      await createTask(taskData, documents);
    }
  };

  return (
    <>
      <TaskList
        initialTasks={tasks}
        users={users}
        articleId={articleId}
        articleTitle={articleTitle}
        articleDescription={articleDescription}
        objetId={objetId}
        sectorId={sectorId}
        onNewTask={handleNewTask}
      />

      <TaskForm
        task={selectedTask}
        users={users}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTask}
      />
    </>
  );
}
