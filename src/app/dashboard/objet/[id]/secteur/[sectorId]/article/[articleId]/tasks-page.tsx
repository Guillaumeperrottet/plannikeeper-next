"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Filter,
  Search,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import TaskForm from "./task-form";
import { toast } from "sonner";

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

export default function TasksPage({
  initialTasks,
  users,
  articleId,
  articleTitle,
  articleDescription,
  objetId,
  sectorId,
}: {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Filtrer les tâches quand le filtre ou la recherche change
  useEffect(() => {
    let result = [...tasks];

    // Appliquer le filtre de statut
    if (filter !== "all") {
      result = result.filter((task) => task.status === filter);
    }

    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.taskType?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(result);
  }, [filter, searchQuery, tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowAddForm(false);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setShowAddForm(true);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      // Pour une nouvelle tâche
      if (!updatedTask.id) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...updatedTask,
            articleId,
          }),
        });

        if (!response.ok)
          throw new Error("Erreur lors de la création de la tâche");

        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
        toast.success("Tâche créée avec succès");
      }
      // Pour une tâche existante
      else {
        const response = await fetch(`/api/tasks/${updatedTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        });

        if (!response.ok)
          throw new Error("Erreur lors de la mise à jour de la tâche");

        const updated = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        toast.success("Tâche mise à jour avec succès");
      }

      setSelectedTask(null);
      setShowAddForm(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok)
        throw new Error("Erreur lors de la suppression de la tâche");

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setSelectedTask(null);
      toast.success("Tâche supprimée avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
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

      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du statut");

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Statut mis à jour avec succès");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
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

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar des tâches */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <Link href={`/dashboard/objet/${objetId}/view`} className="mr-2">
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </Link>
          <h1 className="font-medium truncate">{articleTitle}</h1>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2.5 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher des tâches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Filtrer:
            </span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-2 py-1"
          >
            <option value="all">Toutes</option>
            <option value="pending">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        <button
          onClick={handleNewTask}
          className="mx-3 mt-3 mb-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Nouvelle tâche
        </button>

        <div className="overflow-y-auto flex-1 py-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              Aucune tâche trouvée
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4",
                    selectedTask?.id === task.id
                      ? "bg-gray-100 dark:bg-gray-700 border-primary"
                      : "border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium truncate">{task.name}</div>
                    <div
                      className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusName(task.status)}
                    </div>
                  </div>

                  {task.realizationDate && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(task.realizationDate)}

                      {task.assignedTo && (
                        <>
                          <span className="mx-1.5">•</span>
                          <User size={12} className="mr-1" />
                          <span className="truncate">
                            {task.assignedTo.name}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto bg-white dark:bg-gray-800 p-6"
      >
        <AnimatePresence mode="wait">
          {showAddForm ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <TaskForm
                users={users}
                articleId={articleId}
                onSave={handleTaskSave}
                onCancel={() => setShowAddForm(false)}
              />
            </motion.div>
          ) : selectedTask ? (
            <motion.div
              key={selectedTask.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: selectedTask.color || "#3b82f6",
                      }}
                    />
                    <h1 className="text-2xl font-bold">{selectedTask.name}</h1>
                  </div>
                  <div
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      selectedTask.status
                    )}`}
                  >
                    {getStatusName(selectedTask.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="col-span-2 space-y-6">
                    {selectedTask.description && (
                      <div>
                        <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                          Description
                        </h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="whitespace-pre-wrap">
                            {selectedTask.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTask.executantComment && (
                      <div>
                        <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                          Commentaire d&apos;exécution
                        </h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-primary">
                          <p className="whitespace-pre-wrap">
                            {selectedTask.executantComment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-3">
                        Informations
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Calendar
                            size={16}
                            className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400"
                          />
                          <div>
                            <div className="text-sm font-medium">
                              Date prévue
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(selectedTask.realizationDate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <User
                            size={16}
                            className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400"
                          />
                          <div>
                            <div className="text-sm font-medium">Assigné à</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedTask.assignedTo?.name || "Non assigné"}
                            </div>
                          </div>
                        </div>

                        {selectedTask.taskType && (
                          <div className="flex items-start">
                            <Clock
                              size={16}
                              className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400"
                            />
                            <div>
                              <div className="text-sm font-medium">
                                Type de tâche
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedTask.taskType}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedTask.recurring && (
                          <div className="flex items-start">
                            <Calendar
                              size={16}
                              className="mt-0.5 mr-2 text-gray-500 dark:text-gray-400"
                            />
                            <div>
                              <div className="text-sm font-medium">
                                Récurrence
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedTask.period === "daily" &&
                                  "Quotidienne"}
                                {selectedTask.period === "weekly" &&
                                  "Hebdomadaire"}
                                {selectedTask.period === "monthly" &&
                                  "Mensuelle"}
                                {selectedTask.period === "quarterly" &&
                                  "Trimestrielle"}
                                {selectedTask.period === "yearly" && "Annuelle"}
                                {selectedTask.endDate &&
                                  ` jusqu'au ${formatDate(
                                    selectedTask.endDate
                                  )}`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-3">
                        Dates
                      </h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Créée:
                          </span>
                          <span>{formatDate(selectedTask.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            Mise à jour:
                          </span>
                          <span>{formatDate(selectedTask.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <div className="flex gap-2">
                    {selectedTask.status !== "completed" && (
                      <button
                        onClick={() =>
                          handleTaskStatusChange(selectedTask.id, "completed")
                        }
                        className="px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 90%, black 10%)] rounded-lg transition-colors"
                      >
                        Marquer comme terminée
                      </button>
                    )}
                    {selectedTask.status === "completed" && (
                      <button
                        onClick={() =>
                          handleTaskStatusChange(selectedTask.id, "pending")
                        }
                        className="px-4 py-2 text-sm font-medium text-[var(--secondary-foreground)] bg-[var(--secondary)] hover:bg-[color-mix(in srgb, var(--secondary) 90%, black 10%)] rounded-lg transition-colors"
                      >
                        Rouvrir la tâche
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddForm(true);
                        setSelectedTask(selectedTask);
                      }}
                      className="px-4 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--accent)] hover:bg-[color-mix(in srgb, var(--accent) 90%, black 10%)] hover:text-[var(--primary-foreground)] rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleTaskDelete(selectedTask.id)}
                      className="px-4 py-2 text-sm font-medium text-[var(--destructive)] bg-[var(--destructive-foreground)] hover:bg-[color-mix(in srgb, var(--destructive-foreground) 90%, black 10%)] hover:text-[var(--destructive)] rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center text-center p-6"
            >
              <div className="w-20 h-20 bg-[var(--card)] rounded-full flex items-center justify-center mb-4">
                <Calendar
                  size={32}
                  className="text-[var(--muted-foreground)]"
                />
              </div>
              <h2 className="text-xl font-semibold mb-2">Gestion des tâches</h2>
              <p className="text-[var(--muted-foreground)] max-w-md mb-6">
                {articleDescription ||
                  "Sélectionnez une tâche dans la liste ou créez-en une nouvelle pour commencer."}
              </p>
              <button
                onClick={handleNewTask}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[color-mix(in srgb, var(--primary) 90%, black 10%)] transition-colors"
              >
                <Plus size={16} />
                Nouvelle tâche
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
