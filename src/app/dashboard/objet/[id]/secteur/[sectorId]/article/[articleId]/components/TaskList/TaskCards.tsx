"use client";

import { Task } from "../../lib/types";
import { TaskCard } from "./TaskCard";

interface TaskCardsProps {
  tasks: Task[];
  objetId: string;
  sectorId: string;
  articleId: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskCards({
  tasks,
  objetId,
  sectorId,
  articleId,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange,
}: TaskCardsProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-gray-900 font-medium mb-2">Aucune tâche</p>
        <p className="text-sm text-gray-500">
          Créez votre première tâche pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          objetId={objetId}
          sectorId={sectorId}
          articleId={articleId}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
