"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import TaskFormMobileOptimized from "./TaskFormMobileOptimized";
import TaskForm from "./task-form";
import ArchiveCompletedButton from "./ArchiveCompletedButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Search,
  Plus,
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

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
  archived?: boolean;
};

export default function TasksPage({
  initialTasks,
  users,
  articleId,
  articleTitle,
  articleDescription,
}: {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.filter((task) => !task.archived)
  );
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [useOptimizedForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour archiver ou désarchiver les tâches terminées
  const handleBulkArchiveCompleted = () => {
    // Rafraîchir la liste des tâches après l'archivage
    setTasks((prev) => prev.filter((task) => task.status !== "completed"));
  };

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      // setIsMobileView(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Gérer le message d'information pour les tâches supprimées
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("taskDeleted") === "true") {
      toast.info("La tâche que vous cherchiez a été supprimée.", {
        duration: 5000,
      });
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowAddForm(true);
    setTaskMenuOpen(null);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowAddForm(true);
    setTaskMenuOpen(null);
  };

  const handleNewTask = () => {
    setSelectedTaskId(null);
    setShowAddForm(true);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleTaskMenuToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskMenuOpen(taskMenuOpen === taskId ? null : taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression");

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setTaskMenuOpen(null);
      toast.success("Tâche supprimée avec succès");
    } catch {
      toast.error("Échec de la suppression de la tâche");
    }
  };

  const handleTaskSave = async (taskData: Record<string, unknown>) => {
    try {
      const url = selectedTaskId
        ? `/api/tasks/${selectedTaskId}`
        : "/api/tasks";
      const method = selectedTaskId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          articleId,
        }),
      });

      if (!response.ok) throw new Error("Échec de la sauvegarde");

      const savedTask = await response.json();

      if (selectedTaskId) {
        setTasks((prev) =>
          prev.map((task) => (task.id === selectedTaskId ? savedTask : task))
        );
        toast.success("Tâche mise à jour avec succès");
      } else {
        setTasks((prev) => [savedTask, ...prev]);
        toast.success("Tâche créée avec succès");
      }

      setShowAddForm(false);
      setSelectedTaskId(null);
    } catch {
      toast.error("Échec de la sauvegarde de la tâche");
    }
  };

  // Apply search, status filter and sorting to tasks
  useEffect(() => {
    let result = [...tasks];

    result = result.filter((task) => !task.archived);

    // Apply status filter
    if (activeFilter !== "all") {
      result = result.filter((task) => task.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.description?.toLowerCase() || "").includes(query) ||
          (task.taskType?.toLowerCase() || "").includes(query) ||
          (task.assignedTo?.name.toLowerCase() || "").includes(query)
      );
    }

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "assignedTo":
            aValue = a.assignedTo?.name.toLowerCase() || "";
            bValue = b.assignedTo?.name.toLowerCase() || "";
            break;
          case "taskType":
            aValue = a.taskType?.toLowerCase() || "";
            bValue = b.taskType?.toLowerCase() || "";
            break;
          case "createdAt":
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case "realizationDate":
            aValue = a.realizationDate
              ? new Date(a.realizationDate)
              : new Date(0);
            bValue = b.realizationDate
              ? new Date(b.realizationDate)
              : new Date(0);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredTasks(result);
  }, [tasks, searchQuery, activeFilter, sortField, sortDirection]);

  // Close task menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTaskMenuOpen(null);
    };

    if (taskMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [taskMenuOpen]);

  const getSelectedTask = () => {
    if (!selectedTaskId) return undefined;
    return tasks.find((task) => task.id === selectedTaskId) || undefined;
  };

  // Status badge component - version compacte
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case "pending":
          return {
            text: "À faire",
            color: "text-orange-600",
          };
        case "in_progress":
          return {
            text: "En cours",
            color: "text-blue-600",
          };
        case "completed":
          return {
            text: "Terminé",
            color: "text-green-600",
          };
        case "cancelled":
          return {
            text: "Annulé",
            color: "text-gray-500",
          };
        default:
          return {
            text: "À faire",
            color: "text-gray-500",
          };
      }
    };

    const config = getStatusConfig(status);

    return (
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area with integrated filter area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden flex flex-col md:flex-row"
      >
        {showAddForm ? (
          useOptimizedForm ? (
            <TaskFormMobileOptimized
              task={getSelectedTask()}
              users={users}
              articleId={articleId}
              onSave={handleTaskSave}
              onCancel={() => {
                setShowAddForm(false);
                setSelectedTaskId(null);
              }}
            />
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <TaskForm
                task={getSelectedTask()}
                users={users}
                articleId={articleId}
                onSave={handleTaskSave}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedTaskId(null);
                }}
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Modern header - version compacte */}
            <div className="bg-white border-b px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {articleTitle}
                  </h1>
                  {articleDescription && (
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                      {articleDescription}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-1.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-56 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleNewTask}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle tâche
                  </button>
                </div>
              </div>
            </div>

            {/* Filter buttons - version compacte */}
            <div className="bg-white border-b px-6 py-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-2 py-1 text-sm transition-colors ${
                    activeFilter === "all"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setActiveFilter("pending")}
                  className={`px-2 py-1 text-sm transition-colors ${
                    activeFilter === "pending"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  À faire
                </button>
                <button
                  onClick={() => setActiveFilter("in_progress")}
                  className={`px-2 py-1 text-sm transition-colors ${
                    activeFilter === "in_progress"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setActiveFilter("completed")}
                  className={`px-2 py-1 text-sm transition-colors ${
                    activeFilter === "completed"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Terminées
                </button>
                <button
                  onClick={() => setActiveFilter("cancelled")}
                  className={`px-2 py-1 text-sm transition-colors ${
                    activeFilter === "cancelled"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Annulées
                </button>
              </div>
            </div>

            {/* Tasks Table - version épurée */}
            <div className="flex-1 overflow-auto">
              <div className="bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          STATUT
                          {getSortIcon("status")}
                        </button>
                      </TableHead>
                      <TableHead className="text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          TÂCHE
                          {getSortIcon("name")}
                        </button>
                      </TableHead>
                      <TableHead className="w-[140px] text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("assignedTo")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          ASSIGNÉ À{getSortIcon("assignedTo")}
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("taskType")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          TYPE
                          {getSortIcon("taskType")}
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          CRÉÉ LE
                          {getSortIcon("createdAt")}
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px] text-xs font-normal text-gray-500 py-2">
                        <button
                          onClick={() => handleSort("realizationDate")}
                          className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                          ÉCHÉANCE
                          {getSortIcon("realizationDate")}
                        </button>
                      </TableHead>
                      <TableHead className="w-[80px] text-xs font-normal text-gray-500 py-2">
                        ACTIONS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <p className="text-sm">
                              {searchQuery
                                ? "Aucune tâche trouvée"
                                : "Aucune tâche pour le moment"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => handleTaskClick(task.id)}
                        >
                          <TableCell className="py-2">
                            <StatusBadge status={task.status} />
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                {task.name}
                                {task.recurring && (
                                  <span className="text-gray-400 text-xs">
                                    <RefreshCcw size={10} />
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <div className="text-xs text-gray-500 line-clamp-1">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-sm text-gray-700">
                              {task.assignedTo
                                ? task.assignedTo.name
                                : "Non assigné"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-sm text-gray-700">
                              {task.taskType || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-sm text-gray-500">
                              {formatDate(task.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-sm text-gray-500">
                              {formatDate(task.realizationDate) || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="relative">
                              <button
                                onClick={(e) =>
                                  handleTaskMenuToggle(task.id, e)
                                }
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown menu simplifié */}
                              {taskMenuOpen === task.id && (
                                <div className="absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg w-48">
                                  <ul className="py-1 text-sm">
                                    <li>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditTask(task.id);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Modifier
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteTask(task.id);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Archive completed tasks button */}
              {filteredTasks.some((task) => task.status === "completed") && (
                <div className="p-4 pt-3 border-t bg-white">
                  <div className="flex justify-end">
                    <ArchiveCompletedButton
                      completedTasks={filteredTasks.filter(
                        (task) => task.status === "completed"
                      )}
                      onArchiveCompleted={handleBulkArchiveCompleted}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
