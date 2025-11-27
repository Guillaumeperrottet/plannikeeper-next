"use client";

import { useState, useEffect } from "react";
import { Task, User } from "../../lib/types";
import { TaskFilters } from "./TaskFilters";
import { TaskTable } from "./TaskTable";
import { TaskCards } from "./TaskCards";
import { useTaskFilters } from "../../hooks/useTaskFilters";
import { useTaskMutations } from "../../hooks/useTaskMutations";
import { Input } from "@/app/components/ui/input";

interface TaskListProps {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
  onNewTask: () => void;
}

export function TaskList({
  initialTasks,
  articleId,
  articleTitle,
  articleDescription,
  objetId,
  sectorId,
  onNewTask,
}: TaskListProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    articleDescription || ""
  );

  const {
    filteredTasks,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortField,
    sortDirection,
    handleSort,
    setTasks,
  } = useTaskFilters(initialTasks);

  const { deleteTask, archiveTask, changeStatus } = useTaskMutations({
    articleId,
    onTasksChange: setTasks,
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setViewMode(window.innerWidth < 768 ? "cards" : "table");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleArchiveCompleted = () => {
    const completedTaskIds = filteredTasks
      .filter((task) => task.status === "completed")
      .map((task) => task.id);

    completedTaskIds.forEach((id) => {
      archiveTask(id);
    });
  };

  const handleDescriptionSave = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleTitle,
          description: editedDescription,
          positionX: 0,
          positionY: 0,
          width: 300,
          height: 200,
        }),
      });

      if (response.ok) {
        setIsEditingDescription(false);
      }
    } catch (error) {
      console.error("Erreur mise à jour description:", error);
    }
  };

  const completedTasks = filteredTasks.filter(
    (task) => task.status === "completed"
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {articleTitle}
          </h1>
          {isEditingDescription ? (
            <div className="mt-2 max-w-lg">
              <Input
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDescriptionSave();
                  if (e.key === "Escape") setIsEditingDescription(false);
                }}
                onBlur={handleDescriptionSave}
                placeholder="Ajouter une description..."
                className="text-sm"
                autoFocus
              />
            </div>
          ) : (
            <p
              className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700 transition-colors"
              onClick={() => setIsEditingDescription(true)}
            >
              {articleDescription || "Ajouter une description..."}
            </p>
          )}
        </div>

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          resultCount={filteredTasks.length}
          onNewTask={onNewTask}
          completedTasks={completedTasks}
          onArchiveCompleted={handleArchiveCompleted}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "table" ? (
          <TaskTable
            tasks={filteredTasks}
            objetId={objetId}
            sectorId={sectorId}
            articleId={articleId}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDelete={deleteTask}
            onArchive={archiveTask}
            onStatusChange={changeStatus}
          />
        ) : (
          <TaskCards
            tasks={filteredTasks}
            objetId={objetId}
            sectorId={sectorId}
            articleId={articleId}
            onDelete={deleteTask}
            onArchive={archiveTask}
            onStatusChange={changeStatus}
          />
        )}
      </div>
    </div>
  );
}
