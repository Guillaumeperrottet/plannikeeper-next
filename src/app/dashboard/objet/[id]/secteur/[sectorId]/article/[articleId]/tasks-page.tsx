"use client";

import DocumentsList from "./documents-list";
import DocumentUpload from "./document-upload";
import TaskComments from "./TaskComments";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import TaskForm from "./task-form";
import { toast } from "sonner";
import TaskFormMobileOptimized from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/TaskFormMobileOptimized";
import {
  Calendar,
  Clock,
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
  AlertCircle,
  CheckCircle2,
  Paperclip,
  ClipboardList,
  CircleOff,
  LayoutList,
  ChevronRight,
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

// Options de tri disponibles
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
    label: "Date de création (plus récente)",
    sortFn: (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  },
];

// État du filtre avancé
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

// État des sections repliées
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
  selectedTaskId: string | null;
  isMobileView: boolean;
}

const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  status,
  icon,
  tasks,
  isCollapsed,
  onToggle,
  onTaskClick,
  selectedTaskId,
}) => {
  const taskCount = tasks.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[color:var(--warning-background)] text-[color:var(--warning-foreground)] border-[color:var(--warning-border)]";
      case "in_progress":
        return "bg-[color:var(--info-background)] text-[color:var(--info-foreground)] border-[color:var(--info-border)]";
      case "completed":
        return "bg-[color:var(--success-background)] text-[color:var(--success-foreground)] border-[color:var(--success-border)]";
      case "cancelled":
        return "bg-[color:var(--destructive-background)] text-[color:var(--destructive-foreground)] border-[color:var(--destructive-border)]";
      default:
        return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="border border-[color:var(--border)] rounded-lg overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[color:var(--muted)]/50 transition-colors ${getStatusColor(
          status
        )}`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={18} />
          </motion.div>
          {icon}
          <span className="font-medium text-sm sm:text-base">{title}</span>
          <span className="bg-white/20 text-sm px-2 py-0.5 rounded-full">
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
            <div className="max-h-[300px] overflow-y-auto">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-xs sm:text-sm transition-colors border-b border-[color:var(--border)] last:border-0",
                    selectedTaskId === task.id
                      ? "bg-[color:var(--accent)] border-l-4 border-[color:var(--primary)]"
                      : "border-l-4 border-transparent hover:bg-[color:var(--accent)] text-[color:var(--foreground)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium truncate mr-2">{task.name}</div>
                  </div>

                  <div className="flex flex-wrap items-center text-[10px] sm:text-xs text-[color:var(--muted-foreground)] gap-2">
                    {task.taskType && (
                      <span className="flex items-center">
                        <Tag size={10} className="mr-1 sm:w-3 sm:h-3" />
                        <span className="truncate">{task.taskType}</span>
                      </span>
                    )}

                    {task.realizationDate && (
                      <span className="flex items-center">
                        <Calendar size={10} className="mr-1 sm:w-3 sm:h-3" />
                        <span>{formatDate(task.realizationDate)}</span>
                      </span>
                    )}

                    {task.assignedTo && (
                      <span className="flex items-center">
                        <User size={10} className="mr-1 sm:w-3 sm:h-3" />
                        <span className="truncate">{task.assignedTo.name}</span>
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {tasks.length === 0 && (
                <div className="px-4 py-3 text-sm text-[color:var(--muted-foreground)]">
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("dateAsc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // État pour le mode mobile
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [useOptimizedForm, setUseOptimizedForm] = useState(false);

  // État pour les sections repliées
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>(
    {
      pending: false,
      in_progress: false,
      completed: true, // Par défaut, les tâches terminées sont repliées
      cancelled: true, // Par défaut, les tâches annulées sont repliées
    }
  );

  useEffect(() => {
    // Réinitialiser l'état de navigation quand la page se monte
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setUseOptimizedForm(window.innerWidth < 768);
      setIsMobileView(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // État pour le filtre avancé
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

  // Filtrer les tâches
  useEffect(() => {
    let result = [...tasks];

    // Appliquer le filtre de statut simple
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
          task.taskType?.toLowerCase().includes(query) ||
          task.assignedTo?.name.toLowerCase().includes(query)
      );
    }

    // Appliquer les filtres avancés
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

  // Appliquer le tri
  useEffect(() => {
    const sortOption = sortOptions.find((opt) => opt.id === sortBy);
    if (sortOption) {
      const sortedTasks = [...filteredTasks].sort(sortOption.sortFn);
      setDisplayedTasks(sortedTasks);
    } else {
      setDisplayedTasks(filteredTasks);
    }
  }, [filteredTasks, sortBy]);

  // Grouper les tâches par statut
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
    setSelectedTask(task);
    setShowAddForm(false);
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  const handleNewTask = () => {
    setSelectedTask(null);
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

      setSelectedTask(null);
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
      if (isMobileView) {
        setShowSidebar(true);
      }
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

  const getStatusName = (status: string) => {
    switch (status) {
      case "pending":
        return "À faire";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminées";
      case "cancelled":
        return "Annulées";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClipboardList size={18} />;
      case "in_progress":
        return <Clock size={18} />;
      case "completed":
        return <CheckCircle2 size={18} />;
      case "cancelled":
        return <CircleOff size={18} />;
      default:
        return <AlertCircle size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[color:var(--warning-background)] text-[color:var(--warning-foreground)] border-[color:var(--warning-border)]";
      case "in_progress":
        return "bg-[color:var(--info-background)] text-[color:var(--info-foreground)] border-[color:var(--info-border)]";
      case "completed":
        return "bg-[color:var(--success-background)] text-[color:var(--success-foreground)] border-[color:var(--success-border)]";
      case "cancelled":
        return "bg-[color:var(--destructive-background)] text-[color:var(--destructive-foreground)] border-[color:var(--destructive-border)]";
      default:
        return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
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

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[color:var(--background)]">
      {/* Overlay de chargement global */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mx-auto mb-4"></div>
            <p className="text-lg font-medium text-[color:var(--foreground)]">
              Chargement de la tâche...
            </p>
          </div>
        </div>
      )}
      {/* Barre de navigation mobile */}
      {isMobileView && (
        <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] p-3 flex justify-between items-center">
          <Link
            href={`/dashboard/objet/${objetId}/view`}
            className="flex items-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span className="font-medium truncate max-w-[200px]">
              {articleTitle}
            </span>
          </Link>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-full hover:bg-[color:var(--muted)]"
            aria-label={
              showSidebar ? "Masquer les tâches" : "Afficher les tâches"
            }
          >
            {showSidebar ? <X size={18} /> : <LayoutList size={18} />}
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
                ? "absolute inset-0 z-20 bg-[color:var(--background)]"
                : "relative w-96 flex-shrink-0"
            } border-r border-[color:var(--border)] bg-[color:var(--card)] flex flex-col`}
          >
            {!isMobileView && (
              <div className="border-b border-[color:var(--border)] flex items-center">
                <Link
                  href={`/dashboard/objet/${objetId}/view`}
                  className="mr-2 p-2 rounded-full hover:bg-[color:var(--muted)] transition-colors"
                >
                  <ArrowLeft
                    size={18}
                    className="text-[color:var(--muted-foreground)]"
                  />
                </Link>
                <h1 className="font-medium truncate text-[color:var(--foreground)]">
                  {articleTitle}
                </h1>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="p-3 border-b border-[color:var(--border)]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-2.5 top-2.5 text-[color:var(--muted-foreground)]"
                />
                <input
                  type="text"
                  placeholder="Rechercher des tâches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent text-[color:var(--foreground)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Contrôles de filtrage et tri */}
            <div className="p-3 border-b border-[color:var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter
                    size={16}
                    className="text-[color:var(--muted-foreground)]"
                  />
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    Filtres
                  </span>
                </div>

                <div className="flex">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-xs sm:text-sm rounded border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-[color:var(--foreground)]"
                  >
                    <option value="all">Toutes</option>
                    <option value="pending">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminées</option>
                    <option value="cancelled">Annulées</option>
                  </select>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`ml-2 p-1 rounded ${
                      showAdvancedFilters
                        ? "bg-[color:var(--primary)] text-white"
                        : "hover:bg-[color:var(--muted)]"
                    }`}
                    title="Filtres avancés"
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                </div>
              </div>

              {/* Options de tri - Optimisées pour mobile */}
              <div className="flex justify-between items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowSortOptions(!showSortOptions)}
                    className="flex items-center gap-1 text-xs sm:text-sm font-medium px-2 py-1 rounded hover:bg-[color:var(--muted)]"
                  >
                    <ArrowDownUp size={12} className="sm:w-4 sm:h-4" />
                    <span>Trier</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${
                        showSortOptions ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showSortOptions && (
                    <div className="absolute z-10 left-0 mt-1 bg-background border border-border rounded-md shadow-lg w-48">
                      {sortOptions.map((option) => (
                        <button
                          key={option.id}
                          className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted flex justify-between items-center ${
                            sortBy === option.id ? "bg-muted" : ""
                          }`}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortOptions(false);
                          }}
                        >
                          {option.label}
                          {sortBy === option.id && (
                            <Check size={12} className="sm:w-4 sm:h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton Nouvelle tâche */}
            <button
              onClick={handleNewTask}
              className="mx-3 mt-3 mb-2 flex items-center justify-center gap-2 py-1.5 sm:py-2 px-3 rounded-lg text-xs sm:text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 transition-colors"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              Nouvelle tâche
            </button>

            {/* Liste des tâches avec sections repliables */}
            <div className="overflow-y-auto flex-1 py-2 px-1">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-6 text-[color:var(--muted-foreground)] text-xs sm:text-sm">
                  {hasActiveFilters
                    ? "Aucune tâche ne correspond aux filtres sélectionnés"
                    : "Aucune tâche trouvée"}
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setFilter("all");
                        setSearchQuery("");
                        resetAdvancedFilters();
                      }}
                      className="block mx-auto mt-2 text-[color:var(--primary)] hover:underline text-xs"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <TaskGroup
                    title="À faire"
                    status="pending"
                    icon={getStatusIcon("pending")}
                    tasks={groupedTasksByStatus.pending}
                    isCollapsed={collapsedSections.pending}
                    onToggle={() => toggleSection("pending")}
                    onTaskClick={handleTaskClick}
                    selectedTaskId={selectedTask?.id || null}
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
                    selectedTaskId={selectedTask?.id || null}
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
                    selectedTaskId={selectedTask?.id || null}
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
                    selectedTaskId={selectedTask?.id || null}
                    isMobileView={isMobileView}
                  />
                </div>
              )}
            </div>

            {/* Bouton de fermeture pour mobile */}
            {isMobileView && (
              <div className="p-3 border-t border-[color:var(--border)]">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-full py-2 text-center bg-[color:var(--muted)] rounded-lg text-xs sm:text-sm font-medium"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contenu principal */}
        <div
          ref={contentRef}
          className={`flex-1 flex flex-col h-screen ${
            isMobileView && showSidebar ? "hidden" : "block"
          } bg-[color:var(--background)]`}
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
                  className="flex-1 overflow-auto p-3 sm:p-6"
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
            ) : selectedTask ? (
              <motion.div
                key={selectedTask.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden p-3 sm:p-6 pb-28 sm:pb-6"
              >
                <div className="max-w-3xl mx-auto flex flex-col">
                  {/* Entête avec le nom de la tâche et le statut */}
                  {!isMobileView && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              selectedTask.color || "var(--primary)",
                          }}
                        />
                        <h1 className="text-xl sm:text-2xl font-bold text-[color:var(--foreground)]">
                          {selectedTask.name}
                        </h1>
                      </div>
                      <div
                        className={`px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                          selectedTask.status
                        )}`}
                      >
                        {getStatusIcon(selectedTask.status)}
                        <span>{getStatusName(selectedTask.status)}</span>
                      </div>
                    </div>
                  )}

                  {/* Contenu principal */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 min-h-0">
                    <div className="col-span-3 md:col-span-2 space-y-3 sm:space-y-4 overflow-auto">
                      {isMobileView && (
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                selectedTask.color || "var(--primary)",
                            }}
                          />
                          <div
                            className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusColor(
                              selectedTask.status
                            )}`}
                          >
                            {getStatusIcon(selectedTask.status)}
                            <span>{getStatusName(selectedTask.status)}</span>
                          </div>
                        </div>
                      )}

                      {selectedTask.description && (
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-1 sm:mb-2">
                            Description
                          </h3>
                          <div className="p-3 sm:p-4 bg-[color:var(--muted)] rounded-lg max-h-[150px] overflow-auto">
                            <p className="whitespace-pre-wrap text-[color:var(--foreground)] text-xs sm:text-sm">
                              {selectedTask.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedTask.executantComment && (
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-1 sm:mb-2">
                            Commentaire d&apos;exécution
                          </h3>
                          <div className="p-3 sm:p-4 bg-[color:var(--muted)] rounded-lg border-l-4 border-[color:var(--primary)] max-h-[150px] overflow-auto">
                            <p className="whitespace-pre-wrap text-[color:var(--foreground)] text-xs sm:text-sm">
                              {selectedTask.executantComment}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Information cards pour mobile */}
                      {isMobileView && (
                        <div className="p-3 bg-[color:var(--muted)] rounded-lg">
                          <h3 className="text-xs font-medium uppercase text-[color:var(--muted-foreground)] mb-2">
                            Informations
                          </h3>

                          <div className="space-y-2">
                            <div className="flex items-start">
                              <Calendar
                                size={14}
                                className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                              />
                              <div>
                                <div className="text-xs font-medium text-[color:var(--foreground)]">
                                  Date prévue
                                </div>
                                <div className="text-xs text-[color:var(--muted-foreground)]">
                                  {formatDate(selectedTask.realizationDate)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <User
                                size={14}
                                className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                              />
                              <div>
                                <div className="text-xs font-medium text-[color:var(--foreground)]">
                                  Assigné à
                                </div>
                                <div className="text-xs text-[color:var(--muted-foreground)]">
                                  {selectedTask.assignedTo?.name ||
                                    "Non assigné"}
                                </div>
                              </div>
                            </div>

                            {selectedTask.taskType && (
                              <div className="flex items-start">
                                <Tag
                                  size={14}
                                  className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                                />
                                <div>
                                  <div className="text-xs font-medium text-[color:var(--foreground)]">
                                    Type de tâche
                                  </div>
                                  <div className="text-xs text-[color:var(--muted-foreground)]">
                                    {selectedTask.taskType}
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedTask.recurring && (
                              <div className="flex items-start">
                                <Calendar
                                  size={14}
                                  className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                                />
                                <div>
                                  <div className="text-xs font-medium text-[color:var(--foreground)]">
                                    Récurrence
                                  </div>
                                  <div className="text-xs text-[color:var(--muted-foreground)]">
                                    {selectedTask.period === "daily" &&
                                      "Quotidienne"}
                                    {selectedTask.period === "weekly" &&
                                      "Hebdomadaire"}
                                    {selectedTask.period === "monthly" &&
                                      "Mensuelle"}
                                    {selectedTask.period === "quarterly" &&
                                      "Trimestrielle"}
                                    {selectedTask.period === "yearly" &&
                                      "Annuelle"}
                                    {selectedTask.endDate &&
                                      ` jusqu'au ${formatDate(
                                        selectedTask.endDate
                                      )}`}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start mt-1 pt-1 border-t border-[color:var(--border)]">
                              <Calendar
                                size={14}
                                className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                              />
                              <div>
                                <div className="text-xs text-[color:var(--muted-foreground)]">
                                  <span className="inline-block w-20">
                                    Créée:
                                  </span>
                                  <span>
                                    {formatDate(selectedTask.createdAt)}
                                  </span>
                                </div>
                                <div className="text-xs text-[color:var(--muted-foreground)]">
                                  <span className="inline-block w-20">
                                    Mise à jour:
                                  </span>
                                  <span>
                                    {formatDate(selectedTask.updatedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section Documents */}
                      <div>
                        <h3 className="text-sm sm:text-lg font-semibold mb-2 flex items-center gap-2">
                          <Paperclip size={14} className="sm:w-5 sm:h-5" />
                          Documents
                        </h3>
                        {selectedTask.id ? (
                          <>
                            <div className="max-h-[200px] overflow-auto">
                              <DocumentsList
                                taskId={selectedTask.id}
                                onDocumentsChange={() => {}}
                              />
                            </div>
                            <div className="mt-2">
                              <h4 className="text-xs sm:text-sm font-medium mb-1">
                                Ajouter
                              </h4>
                              <DocumentUpload
                                taskId={selectedTask.id}
                                onUploadSuccess={() => {}}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                            Sauvegardez la tâche pour ajouter des documents.
                          </p>
                        )}
                      </div>

                      {/* Section Commentaires */}
                      {selectedTask.id && (
                        <div className="mt-6">
                          <TaskComments taskId={selectedTask.id} />
                        </div>
                      )}
                    </div>

                    {/* Informations latérales - uniquement pour desktop */}
                    {!isMobileView && (
                      <div className="hidden md:block space-y-4">
                        <div className="p-4 bg-[color:var(--muted)] rounded-lg">
                          <h3 className="text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-3">
                            Informations
                          </h3>

                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Calendar
                                size={16}
                                className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                              />
                              <div>
                                <div className="text-sm font-medium text-[color:var(--foreground)]">
                                  Date prévue
                                </div>
                                <div className="text-sm text-[color:var(--muted-foreground)]">
                                  {formatDate(selectedTask.realizationDate)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <User
                                size={16}
                                className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                              />
                              <div>
                                <div className="text-sm font-medium text-[color:var(--foreground)]">
                                  Assigné à
                                </div>
                                <div className="text-sm text-[color:var(--muted-foreground)]">
                                  {selectedTask.assignedTo?.name ||
                                    "Non assigné"}
                                </div>
                              </div>
                            </div>

                            {selectedTask.taskType && (
                              <div className="flex items-start">
                                <Tag
                                  size={16}
                                  className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                                />
                                <div>
                                  <div className="text-sm font-medium text-[color:var(--foreground)]">
                                    Type de tâche
                                  </div>
                                  <div className="text-sm text-[color:var(--muted-foreground)]">
                                    {selectedTask.taskType}
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedTask.recurring && (
                              <div className="flex items-start">
                                <Calendar
                                  size={16}
                                  className="mt-0.5 mr-2 text-[color:var(--muted-foreground)]"
                                />
                                <div>
                                  <div className="text-sm font-medium text-[color:var(--foreground)]">
                                    Récurrence
                                  </div>
                                  <div className="text-sm text-[color:var(--muted-foreground)]">
                                    {selectedTask.period === "daily" &&
                                      "Quotidienne"}
                                    {selectedTask.period === "weekly" &&
                                      "Hebdomadaire"}
                                    {selectedTask.period === "monthly" &&
                                      "Mensuelle"}
                                    {selectedTask.period === "quarterly" &&
                                      "Trimestrielle"}
                                    {selectedTask.period === "yearly" &&
                                      "Annuelle"}
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

                        <div className="p-4 bg-[color:var(--muted)] rounded-lg">
                          <h3 className="text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-3">
                            Dates
                          </h3>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[color:var(--muted-foreground)]">
                                Créée:
                              </span>
                              <span className="text-[color:var(--foreground)]">
                                {formatDate(selectedTask.createdAt)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[color:var(--muted-foreground)]">
                                Mise à jour:
                              </span>
                              <span className="text-[color:var(--foreground)]">
                                {formatDate(selectedTask.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action en bas - version desktop */}
                  <div className="hidden sm:flex pt-4 justify-between gap-2">
                    <div className="flex gap-2">
                      {selectedTask.status !== "completed" && (
                        <button
                          onClick={() => {
                            if (selectedTask.id) {
                              handleTaskStatusChange(
                                selectedTask.id,
                                "completed"
                              );
                            }
                          }}
                          disabled={!selectedTask.id}
                          className="px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Marquer comme terminée
                        </button>
                      )}
                      {selectedTask.status === "completed" && (
                        <button
                          onClick={() => {
                            if (selectedTask.id) {
                              handleTaskStatusChange(
                                selectedTask.id,
                                "pending"
                              );
                            }
                          }}
                          disabled={!selectedTask.id}
                          className="px-4 py-2 text-sm font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Rouvrir la tâche
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          alert("Fonctionnalité Modifier à implémenter");
                        }}
                        className="px-4 py-2 text-sm font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] hover:bg-opacity-90 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (selectedTask.id) {
                            handleTaskDelete(selectedTask.id);
                          }
                        }}
                        disabled={!selectedTask.id}
                        className="px-4 py-2 text-sm font-medium text-[color:var(--destructive-foreground)] bg-[color:var(--destructive)] hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barre d'actions fixe pour mobile */}
                {isMobileView && selectedTask && (
                  <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-20 flex gap-2">
                    {selectedTask.status !== "completed" ? (
                      <button
                        onClick={() => {
                          if (selectedTask.id) {
                            handleTaskStatusChange(
                              selectedTask.id,
                              "completed"
                            );
                          }
                        }}
                        disabled={!selectedTask.id}
                        className="flex-1 px-3 py-2 text-xs font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] rounded-lg"
                      >
                        Terminer
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (selectedTask.id) {
                            handleTaskStatusChange(selectedTask.id, "pending");
                          }
                        }}
                        disabled={!selectedTask.id}
                        className="flex-1 px-3 py-2 text-xs font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] rounded-lg"
                      >
                        Rouvrir
                      </button>
                    )}

                    <button
                      onClick={() =>
                        alert("Fonctionnalité Modifier à implémenter")
                      }
                      className="flex-1 px-3 py-2 text-xs font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] rounded-lg"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => {
                        if (selectedTask.id) {
                          handleTaskDelete(selectedTask.id);
                        }
                      }}
                      disabled={!selectedTask.id}
                      className="flex-1 px-3 py-2 text-xs font-medium text-[color:var(--destructive-foreground)] bg-[color:var(--destructive)] rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[color:var(--muted)] rounded-full flex items-center justify-center mb-4">
                  <Calendar
                    size={24}
                    className="sm:w-8 sm:h-8 text-[color:var(--muted-foreground)]"
                  />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-[color:var(--foreground)]">
                  Gestion des tâches
                </h2>
                <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] max-w-md mb-6">
                  {articleDescription ||
                    "Sélectionnez une tâche dans la liste ou créez-en une nouvelle pour commencer."}
                </p>
                <button
                  onClick={handleNewTask}
                  className="flex items-center justify-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 transition-colors"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
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
