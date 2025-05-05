"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskForm from "./task-form";
import { toast } from "sonner";
import TaskFormMobileOptimized from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/TaskFormMobileOptimized";
import {
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  ArrowLeft,
  ArrowDownUp,
  Check,
  X,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  CircleOff,
  LayoutList,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import Link from "next/link";

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

type SortOption = {
  id: string;
  label: string;
  sortFn: (a: Task, b: Task) => number;
};

const sortOptions: SortOption[] = [
  {
    id: "dateAsc",
    label: "Date (plus proche)",
    sortFn: (a, b) => {
      if (!a.realizationDate && !b.realizationDate) return 0;
      if (!a.realizationDate) return 1;
      if (!b.realizationDate) return -1;
      return (
        new Date(a.realizationDate).getTime() -
        new Date(b.realizationDate).getTime()
      );
    },
  },
  {
    id: "dateDesc",
    label: "Date (plus éloignée)",
    sortFn: (a, b) => {
      if (!a.realizationDate && !b.realizationDate) return 0;
      if (!a.realizationDate) return 1;
      if (!b.realizationDate) return -1;
      return (
        new Date(b.realizationDate).getTime() -
        new Date(a.realizationDate).getTime()
      );
    },
  },
  {
    id: "nameAsc",
    label: "Nom (A-Z)",
    sortFn: (a, b) => a.name.localeCompare(b.name),
  },
  {
    id: "createdDesc",
    label: "Plus récentes",
    sortFn: (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  },
];

type FilterState = {
  status: string[];
  assignedToId: string | null;
  taskType: string | null;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  recurring: boolean | null;
};

type CollapsedSections = {
  [key: string]: boolean;
};

interface TaskGroupProps {
  title: string;
  status: string;
  icon: React.ReactNode;
  tasks: Task[];
  isCollapsed: boolean;
  onToggle: () => void;
  onTaskClick: (task: Task) => void;
  isMobileView: boolean;
}

const formatDate = (date: Date | null) => {
  if (!date) return "Non définie";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  status,
  icon,
  tasks,
  isCollapsed,
  onToggle,
  onTaskClick,
}) => {
  const taskCount = tasks.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-amber-500 bg-amber-50/30";
      case "in_progress":
        return "border-l-blue-500 bg-blue-50/30";
      case "completed":
        return "border-l-emerald-500 bg-emerald-50/30";
      case "cancelled":
        return "border-l-red-500 bg-red-50/30";
      default:
        return "border-l-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-3">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-all duration-200 ${getStatusColor(
          status
        )}`}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 90 }}
            transition={{ duration: 0.2 }}
            className="text-gray-500"
          >
            <ChevronRight size={18} />
          </motion.div>
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-base">{title}</span>
          </div>
          <span className="bg-white/40 px-2.5 py-0.5 rounded-full text-sm font-medium">
            {taskCount}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100 bg-white">
              {tasks.map((task) => (
                <motion.button
                  key={task.id}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  onClick={() => onTaskClick(task)}
                  className={`w-full px-4 py-3 text-left border-l-4 ${getTaskStatusColor(
                    task.status
                  )} hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: task.color || "var(--primary)",
                          }}
                        />
                        <h3 className="font-medium text-base text-gray-900 truncate">
                          {task.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {task.taskType && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            <Tag size={12} />
                            <span>{task.taskType}</span>
                          </span>
                        )}

                        {task.realizationDate && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            <Calendar size={12} />
                            <span>{formatDate(task.realizationDate)}</span>
                          </span>
                        )}

                        {task.assignedTo && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            <User size={12} />
                            <span className="truncate max-w-[120px]">
                              {task.assignedTo.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="flex-shrink-0 text-gray-400"
                    />
                  </div>
                </motion.button>
              ))}

              {tasks.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500 text-center bg-gray-50">
                  Aucune tâche dans cette catégorie
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("dateAsc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [useOptimizedForm, setUseOptimizedForm] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(
    {
      pending: false,
      in_progress: false,
      completed: true,
      cancelled: true,
    }
  );

  useEffect(() => {
    const checkIfMobile = () => {
      setUseOptimizedForm(window.innerWidth < 768);
      setIsMobileView(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const [advancedFilter, setAdvancedFilter] = useState<FilterState>({
    status: [],
    assignedToId: null,
    taskType: null,
    dateRange: {
      from: null,
      to: null,
    },
    recurring: null,
  });

  useEffect(() => {
    let result = [...tasks];

    if (filter !== "all") {
      result = result.filter((task) => task.status === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.taskType?.toLowerCase().includes(query) ||
          task.assignedTo?.name.toLowerCase().includes(query)
      );
    }

    if (showAdvancedFilters) {
      if (advancedFilter.status.length > 0) {
        result = result.filter((task) =>
          advancedFilter.status.includes(task.status)
        );
      }

      if (advancedFilter.assignedToId) {
        result = result.filter(
          (task) => task.assignedToId === advancedFilter.assignedToId
        );
      }

      if (advancedFilter.taskType) {
        result = result.filter(
          (task) => task.taskType === advancedFilter.taskType
        );
      }

      if (advancedFilter.dateRange.from) {
        result = result.filter((task) => {
          if (!task.realizationDate) return false;
          const taskDate = new Date(task.realizationDate);
          return taskDate >= advancedFilter.dateRange.from!;
        });
      }

      if (advancedFilter.dateRange.to) {
        result = result.filter((task) => {
          if (!task.realizationDate) return false;
          const taskDate = new Date(task.realizationDate);
          return taskDate <= advancedFilter.dateRange.to!;
        });
      }

      if (advancedFilter.recurring !== null) {
        result = result.filter(
          (task) => task.recurring === advancedFilter.recurring
        );
      }
    }

    setFilteredTasks(result);
  }, [filter, searchQuery, tasks, showAdvancedFilters, advancedFilter]);

  useEffect(() => {
    const sortOption = sortOptions.find((opt) => opt.id === sortBy);
    if (sortOption) {
      const sortedTasks = [...filteredTasks].sort(sortOption.sortFn);
      setDisplayedTasks(sortedTasks);
    } else {
      setDisplayedTasks(filteredTasks);
    }
  }, [filteredTasks, sortBy]);

  const groupedTasksByStatus = useMemo(() => {
    const groups = {
      pending: displayedTasks.filter((task) => task.status === "pending"),
      in_progress: displayedTasks.filter(
        (task) => task.status === "in_progress"
      ),
      completed: displayedTasks.filter((task) => task.status === "completed"),
      cancelled: displayedTasks.filter((task) => task.status === "cancelled"),
    };

    return groups;
  }, [displayedTasks]);

  const handleTaskClick = (task: Task) => {
    window.location.href = `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${task.id}`;
  };

  const handleNewTask = () => {
    setShowAddForm(true);
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  const handleTaskSave = async (updatedTask: Task, documents?: File[]) => {
    try {
      const isNewTask = !tasks.some((t) => t.id === updatedTask.id);

      if (isNewTask) {
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

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(newTask.id, documents);
        }
      } else {
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

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(updated.id, documents);
        }
      }

      setShowAddForm(false);
      if (isMobileView) {
        setShowSidebar(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const uploadDocumentsForTask = async (taskId: string, documents: File[]) => {
    try {
      const uploadPromises = documents.map(async (document) => {
        const formData = new FormData();
        formData.append("file", document);

        const response = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || `Erreur lors de l'upload de ${document.name}`
          );
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      toast.success(`${documents.length} document(s) ajouté(s) à la tâche`);
    } catch (error) {
      console.error("Erreur lors de l'upload des documents:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout des documents"
      );
    }
  };

  const resetAdvancedFilters = () => {
    setAdvancedFilter({
      status: [],
      assignedToId: null,
      taskType: null,
      dateRange: {
        from: null,
        to: null,
      },
      recurring: null,
    });
  };

  const toggleSection = (status: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClipboardList size={18} className="text-amber-500" />;
      case "in_progress":
        return <Clock size={18} className="text-blue-500" />;
      case "completed":
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case "cancelled":
        return <CircleOff size={18} className="text-red-500" />;
      default:
        return <ClipboardList size={18} className="text-gray-500" />;
    }
  };

  const hasActiveFilters =
    searchQuery ||
    filter !== "all" ||
    (showAdvancedFilters &&
      (advancedFilter.status.length > 0 ||
        advancedFilter.assignedToId !== null ||
        advancedFilter.taskType !== null ||
        advancedFilter.dateRange.from !== null ||
        advancedFilter.dateRange.to !== null ||
        advancedFilter.recurring !== null));

  const getTaskCounts = () => {
    const counts = {
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };
    return counts;
  };

  const taskCounts = getTaskCounts();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Barre de navigation mobile */}
      {isMobileView && (
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <Link
            href={`/dashboard/objet/${objetId}/view`}
            className="flex items-center"
          >
            <ArrowLeft size={20} className="mr-3 text-gray-600" />
            <span className="font-medium text-lg truncate max-w-[200px] text-gray-900">
              {articleTitle}
            </span>
          </Link>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={
              showSidebar ? "Masquer les tâches" : "Afficher les tâches"
            }
          >
            {showSidebar ? (
              <X size={20} className="text-gray-600" />
            ) : (
              <LayoutList size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      )}

      {/* Conteneur principal flex adaptatif */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar des tâches */}
        {(showSidebar || !isMobileView) && (
          <div
            className={`${
              isMobileView
                ? "absolute inset-0 z-20 bg-gray-50"
                : "relative w-96 flex-shrink-0"
            } border-r border-gray-200 bg-white flex flex-col shadow-sm`}
          >
            {!isMobileView && (
              <div className="border-b border-gray-200 bg-white p-6 flex items-center">
                <Link
                  href={`/dashboard/objet/${objetId}/view`}
                  className="mr-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold text-lg text-gray-900 truncate">
                    {articleTitle}
                  </h1>
                  {articleDescription && (
                    <p className="text-sm text-gray-500 truncate">
                      {articleDescription}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Barre de recherche améliorée */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher des tâches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Contrôles de filtrage modernisés */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-1 text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  <option value="all">Tous ({taskCounts.all})</option>
                  <option value="pending">
                    À faire ({taskCounts.pending})
                  </option>
                  <option value="in_progress">
                    En cours ({taskCounts.in_progress})
                  </option>
                  <option value="completed">
                    Terminées ({taskCounts.completed})
                  </option>
                  <option value="cancelled">
                    Annulées ({taskCounts.cancelled})
                  </option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2 rounded-lg transition-all hover:bg-gray-100 ${
                    showAdvancedFilters
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600"
                  }`}
                  title="Filtres avancés"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>

              {/* Options de tri modernisées */}
              <div className="flex justify-between items-center mt-4">
                <div className="relative">
                  <button
                    onClick={() => setShowSortOptions(!showSortOptions)}
                    className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <ArrowDownUp size={14} />
                    <span>Trier par</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        showSortOptions ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showSortOptions && (
                    <div className="absolute z-10 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-48 py-1">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center ${
                            sortBy === option.id
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700"
                          }`}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortOptions(false);
                          }}
                        >
                          {option.label}
                          {sortBy === option.id && (
                            <Check size={14} className="text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton Nouvelle tâche modernisé */}
            <div className="p-6 bg-white border-b border-gray-200">
              <button
                onClick={handleNewTask}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm active:scale-98"
              >
                <Plus size={18} />
                Nouvelle tâche
              </button>
            </div>

            {/* Liste des tâches avec sections repliables */}
            <div className="overflow-y-auto flex-1 p-4 bg-gray-50">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {hasActiveFilters ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Filter size={24} className="text-gray-400" />
                      </div>
                      <p className="text-base font-medium mb-1">
                        Aucun résultat
                      </p>
                      <p className="text-sm mb-4">
                        Essayez d&apos;ajuster vos filtres
                      </p>
                      <button
                        onClick={() => {
                          setFilter("all");
                          setSearchQuery("");
                          resetAdvancedFilters();
                        }}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <X size={14} />
                        Réinitialiser les filtres
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList size={24} className="text-gray-400" />
                      </div>
                      <p className="text-base font-medium mb-1">Aucune tâche</p>
                      <p className="text-sm mb-4">Créez votre première tâche</p>
                      <button
                        onClick={handleNewTask}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus size={14} />
                        Nouvelle tâche
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <TaskGroup
                    title="À faire"
                    status="pending"
                    icon={getStatusIcon("pending")}
                    tasks={groupedTasksByStatus.pending}
                    isCollapsed={collapsedSections.pending}
                    onToggle={() => toggleSection("pending")}
                    onTaskClick={handleTaskClick}
                    isMobileView={isMobileView}
                  />

                  <TaskGroup
                    title="En cours"
                    status="in_progress"
                    icon={getStatusIcon("in_progress")}
                    tasks={groupedTasksByStatus.in_progress}
                    isCollapsed={collapsedSections.in_progress}
                    onToggle={() => toggleSection("in_progress")}
                    onTaskClick={handleTaskClick}
                    isMobileView={isMobileView}
                  />

                  <TaskGroup
                    title="Terminées"
                    status="completed"
                    icon={getStatusIcon("completed")}
                    tasks={groupedTasksByStatus.completed}
                    isCollapsed={collapsedSections.completed}
                    onToggle={() => toggleSection("completed")}
                    onTaskClick={handleTaskClick}
                    isMobileView={isMobileView}
                  />

                  <TaskGroup
                    title="Annulées"
                    status="cancelled"
                    icon={getStatusIcon("cancelled")}
                    tasks={groupedTasksByStatus.cancelled}
                    isCollapsed={collapsedSections.cancelled}
                    onToggle={() => toggleSection("cancelled")}
                    onTaskClick={handleTaskClick}
                    isMobileView={isMobileView}
                  />
                </div>
              )}
            </div>

            {/* Bouton de fermeture pour mobile */}
            {isMobileView && (
              <div className="p-6 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-full py-2.5 text-center bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contenu principal modernisé */}
        <div
          ref={contentRef}
          className={`flex-1 flex flex-col h-screen ${
            isMobileView && showSidebar ? "hidden" : "block"
          } bg-gray-50`}
        >
          <AnimatePresence mode="wait">
            {showAddForm ? (
              useOptimizedForm ? (
                <TaskFormMobileOptimized
                  users={users}
                  articleId={articleId}
                  onSave={(task, documents) =>
                    handleTaskSave(task as Task, documents)
                  }
                  onCancel={() => {
                    setShowAddForm(false);
                    if (isMobileView) setShowSidebar(true);
                  }}
                />
              ) : (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-auto p-6"
                >
                  <TaskForm
                    users={users}
                    articleId={articleId}
                    onSave={(task, documents) =>
                      handleTaskSave(task as Task, documents)
                    }
                    onCancel={() => {
                      setShowAddForm(false);
                      if (isMobileView) setShowSidebar(true);
                    }}
                  />
                </motion.div>
              )
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-gray-200">
                  <FileText size={40} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                  Gestion des tâches
                </h2>
                <p className="text-base text-gray-500 max-w-md mb-8">
                  {articleDescription ||
                    "Sélectionnez une tâche dans la liste ou créez-en une nouvelle pour commencer."}
                </p>
                <button
                  onClick={handleNewTask}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm active:scale-98"
                >
                  <Plus size={18} />
                  Nouvelle tâche
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
