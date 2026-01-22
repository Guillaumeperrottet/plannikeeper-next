"use client";

import { useState } from "react";

import { Task } from "../../lib/types";
import { TaskHeader } from "./TaskHeader";
import { TaskActions } from "./TaskActions";
import { TaskInfo } from "./TaskInfo";
import { TaskRecurrence } from "./TaskRecurrence";
import { useTaskDetail } from "./useTaskDetail";
import { motion } from "framer-motion";
import TaskComments from "../../TaskComments";
import { ChevronLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  email: string;
};

interface TaskDetailClientProps {
  task: Task;
  users: User[];
  readonly?: boolean;
}

export function TaskDetailClient({
  task,
  users,
  readonly = false,
}: TaskDetailClientProps) {
  const {
    task: currentTask,
    isLoading,
    handleDelete,
    handleStatusChange,
    handleUpdate,
  } = useTaskDetail({ initialTask: task, readonly });

  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Breadcrumb path
  const breadcrumbPath = currentTask.article
    ? [
        {
          label: currentTask.article.sector.object.nom,
          href: `/dashboard/objet/${currentTask.article.sector.object.id}`,
        },
        {
          label: currentTask.article.sector.name,
          href: `/dashboard/objet/${currentTask.article.sector.object.id}/secteur/${currentTask.article.sector.id}`,
        },
        {
          label: currentTask.article.title,
          href: `/dashboard/objet/${currentTask.article.sector.object.id}/secteur/${currentTask.article.sector.id}/article/${currentTask.article.id}`,
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        {breadcrumbPath.length > 0 && (
          <div className="mb-6">
            <Link
              href={breadcrumbPath[breadcrumbPath.length - 1].href}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à l&apos;article
            </Link>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {breadcrumbPath.map((item, index) => (
                <div key={item.href} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header with Actions */}
        <div className="mb-8 space-y-4">
          <TaskHeader
            task={currentTask}
            users={users}
            readonly={readonly}
            onUpdate={handleUpdate}
            onStatusChange={handleStatusChange}
          />
          <TaskActions
            readonly={readonly}
            isLoading={isLoading}
            currentStatus={currentTask.status}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Unified Modern Layout - Everything Visible */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Info */}
            <TaskInfo
              task={currentTask}
              readonly={readonly}
              onUpdate={handleUpdate}
              refreshKey={refreshKey}
              onUploadSuccess={handleUploadSuccess}
            />

            {/* Recurrence if applicable */}
            {currentTask.recurring && (
              <TaskRecurrence
                task={currentTask}
                isEditing={false}
                editedTask={undefined}
                onTaskChange={() => {}}
              />
            )}
          </div>

          {/* Right Sidebar - Comments - Style moderne sans Card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 border rounded-lg bg-card p-4 shadow-sm lg:h-[calc(100vh-10rem)] flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Commentaires</h3>
              </div>
              <TaskComments taskId={currentTask.id} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
