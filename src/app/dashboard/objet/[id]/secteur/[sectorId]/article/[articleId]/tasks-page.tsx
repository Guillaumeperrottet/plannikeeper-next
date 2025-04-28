"use client";

import DocumentsList from "./documents-list";
import DocumentUpload from "./document-upload";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import TaskForm from "./task-form";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Filter,
  Search,
  Plus,
  Edit,
  Trash,
  Move,
  ChevronLeft,
  ArrowLeft,
  ArrowDownUp,
  Check,
  X,
  Tag,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronDown,
  AlertCircle,
  Inbox,
  CheckCircle2,
  TimerOff,
  Paperclip,
  ClipboardList,
  CircleOff,
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
    id: "nameDesc",
    label: "Nom (Z-A)",
    sortFn: (a, b) => b.name.localeCompare(a.name),
  },
  {
    id: "createdAsc",
    label: "Date de création (plus ancienne)",
    sortFn: (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState("w-96"); // Sidebar plus large par défaut
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("dateAsc");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeDivRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

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

  // État pour l'organisation des tâches par section
  const [groupBy, setGroupBy] = useState<
    "status" | "assignee" | "date" | "type" | "none"
  >("status");

  // Effet pour extraire tous les types de tâches uniques
  useEffect(() => {
    const types = new Set<string>();
    tasks.forEach((task) => {
      if (task.taskType) types.add(task.taskType);
    });
    setTaskTypes(Array.from(types).sort());
  }, [tasks]);

  // Gestion du redimensionnement de la sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(
        300,
        Math.min(600, startWidthRef.current + deltaX)
      );

      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`;
        setSidebarWidth(`w-[${newWidth}px]`);
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizingSidebar) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    if (sidebarRef.current) {
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarRef.current.getBoundingClientRect().width;
      setIsResizingSidebar(true);
    }
  };

  // Filtrer les tâches quand le filtre ou la recherche change
  useEffect(() => {
    // Étape 1: Appliquer le filtre de base
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

    // Étape 2: Appliquer les filtres avancés si activés
    if (showAdvancedFilters) {
      // Filtre par statut (multiple)
      if (advancedFilter.status.length > 0) {
        result = result.filter((task) =>
          advancedFilter.status.includes(task.status)
        );
      }

      // Filtre par assigné
      if (advancedFilter.assignedToId) {
        result = result.filter(
          (task) => task.assignedToId === advancedFilter.assignedToId
        );
      }

      // Filtre par type de tâche
      if (advancedFilter.taskType) {
        result = result.filter(
          (task) => task.taskType === advancedFilter.taskType
        );
      }

      // Filtre par date
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

      // Filtre par récurrence
      if (advancedFilter.recurring !== null) {
        result = result.filter(
          (task) => task.recurring === advancedFilter.recurring
        );
      }
    }

    setFilteredTasks(result);
  }, [filter, searchQuery, tasks, showAdvancedFilters, advancedFilter]);

  // Appliquer le tri aux tâches filtrées
  useEffect(() => {
    const sortOption = sortOptions.find((opt) => opt.id === sortBy);
    if (sortOption) {
      const sortedTasks = [...filteredTasks].sort(sortOption.sortFn);
      setDisplayedTasks(sortedTasks);
    } else {
      setDisplayedTasks(filteredTasks);
    }
  }, [filteredTasks, sortBy]);

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

  // Toggle du statut dans le filtre avancé
  const toggleStatusFilter = (status: string) => {
    setAdvancedFilter((prev) => {
      if (prev.status.includes(status)) {
        return { ...prev, status: prev.status.filter((s) => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";

    // Format avec année-mois-jour pour être cohérent entre serveur et client
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${day}/${month}/${year}`;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClipboardList size={16} />;
      case "in_progress":
        return <Clock size={16} />;
      case "completed":
        return <CheckCircle2 size={16} />;
      case "cancelled":
        return <CircleOff size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // Fonction pour grouper les tâches selon le critère choisi
  const getGroupedTasks = () => {
    if (groupBy === "none") {
      return { "Toutes les tâches": displayedTasks };
    }

    if (groupBy === "status") {
      const groups: Record<string, Task[]> = {
        "À faire": [],
        "En cours": [],
        Terminées: [],
        Annulées: [],
      };

      displayedTasks.forEach((task) => {
        switch (task.status) {
          case "pending":
            groups["À faire"].push(task);
            break;
          case "in_progress":
            groups["En cours"].push(task);
            break;
          case "completed":
            groups["Terminées"].push(task);
            break;
          case "cancelled":
            groups["Annulées"].push(task);
            break;
        }
      });

      // Ne retourner que les groupes non vides
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }

    if (groupBy === "assignee") {
      const groups: Record<string, Task[]> = {
        "Non assignées": [],
      };

      // Préparer tous les assignés possibles
      users.forEach((user) => {
        groups[user.name] = [];
      });

      displayedTasks.forEach((task) => {
        if (task.assignedTo) {
          groups[task.assignedTo.name].push(task);
        } else {
          groups["Non assignées"].push(task);
        }
      });

      // Ne retourner que les groupes non vides
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }

    if (groupBy === "date") {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      const nextMonth = new Date();
      nextMonth.setMonth(now.getMonth() + 1);

      const groups: Record<string, Task[]> = {
        "Aujourd'hui": [],
        Demain: [],
        "Cette semaine": [],
        "Ce mois-ci": [],
        "Plus tard": [],
        "Sans date": [],
      };

      displayedTasks.forEach((task) => {
        if (!task.realizationDate) {
          groups["Sans date"].push(task);
          return;
        }

        const taskDate = new Date(task.realizationDate);

        // Comparer seulement les dates sans l'heure
        const taskDateStr = taskDate.toDateString();
        const nowStr = now.toDateString();
        const tomorrowStr = tomorrow.toDateString();

        if (taskDateStr === nowStr) {
          groups["Aujourd'hui"].push(task);
        } else if (taskDateStr === tomorrowStr) {
          groups["Demain"].push(task);
        } else if (taskDate <= nextWeek && taskDate > tomorrow) {
          groups["Cette semaine"].push(task);
        } else if (taskDate <= nextMonth && taskDate > nextWeek) {
          groups["Ce mois-ci"].push(task);
        } else {
          groups["Plus tard"].push(task);
        }
      });

      // Ne retourner que les groupes non vides
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }

    if (groupBy === "type") {
      const groups: Record<string, Task[]> = {
        "Sans type": [],
      };

      // Préparer tous les types possibles
      taskTypes.forEach((type) => {
        groups[type] = [];
      });

      displayedTasks.forEach((task) => {
        if (task.taskType) {
          groups[task.taskType].push(task);
        } else {
          groups["Sans type"].push(task);
        }
      });

      // Ne retourner que les groupes non vides
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }

    return { "Toutes les tâches": displayedTasks };
  };

  const groupedTasks = getGroupedTasks();
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[color:var(--background)]">
      {/* Sidebar plus large des tâches */}
      <div
        ref={sidebarRef}
        className={`relative flex-shrink-0 border-r border-[color:var(--border)] bg-[color:var(--card)] flex flex-col ${sidebarWidth}`}
      >
        <div className="p-4 border-b border-[color:var(--border)] flex items-center">
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

        {/* Barre de recherche améliorée */}
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

            {/* Options de filtrage simples - statuts */}
            <div className="flex">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm rounded border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-[color:var(--foreground)]"
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

          {/* Filtres avancés */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-[color:var(--muted)] rounded-lg mt-2 text-sm">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Filtres avancés</h3>
                    <button
                      onClick={resetAdvancedFilters}
                      className="text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 text-xs"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  {/* Statuts multiples */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">
                      Statut
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {["pending", "in_progress", "completed", "cancelled"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => toggleStatusFilter(status)}
                            className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                              advancedFilter.status.includes(status)
                                ? getStatusColor(status)
                                : "bg-[color:var(--background)] hover:bg-[color:var(--background)]/80"
                            }`}
                          >
                            {getStatusIcon(status)}
                            <span>{getStatusName(status)}</span>
                            {advancedFilter.status.includes(status) && (
                              <Check size={12} />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Assigné à */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">
                      Assigné à
                    </label>
                    <select
                      value={advancedFilter.assignedToId || ""}
                      onChange={(e) =>
                        setAdvancedFilter((prev) => ({
                          ...prev,
                          assignedToId: e.target.value || null,
                        }))
                      }
                      className="w-full px-2 py-1 text-xs rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                    >
                      <option value="">Tous</option>
                      <option value="unassigned">Non assigné</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type de tâche */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">
                      Type de tâche
                    </label>
                    <select
                      value={advancedFilter.taskType || ""}
                      onChange={(e) =>
                        setAdvancedFilter((prev) => ({
                          ...prev,
                          taskType: e.target.value || null,
                        }))
                      }
                      className="w-full px-2 py-1 text-xs rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                    >
                      <option value="">Tous</option>
                      <option value="no-type">Sans type</option>
                      {taskTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Récurrence */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1">
                      Récurrence
                    </label>
                    <select
                      value={
                        advancedFilter.recurring === null
                          ? ""
                          : advancedFilter.recurring
                          ? "true"
                          : "false"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setAdvancedFilter((prev) => ({
                          ...prev,
                          recurring: value === "" ? null : value === "true",
                        }));
                      }}
                      className="w-full px-2 py-1 text-xs rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                    >
                      <option value="">Toutes</option>
                      <option value="true">Récurrentes</option>
                      <option value="false">Non récurrentes</option>
                    </select>
                  </div>

                  {/* Plage de dates */}
                  <div className="mb-2">
                    <label className="block text-xs font-medium mb-1">
                      Plage de dates
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1">Du</label>
                        <input
                          type="date"
                          value={
                            advancedFilter.dateRange.from
                              ? new Date(advancedFilter.dateRange.from)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAdvancedFilter((prev) => ({
                              ...prev,
                              dateRange: {
                                ...prev.dateRange,
                                from: value ? new Date(value) : null,
                              },
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Au</label>
                        <input
                          type="date"
                          value={
                            advancedFilter.dateRange.to
                              ? new Date(advancedFilter.dateRange.to)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setAdvancedFilter((prev) => ({
                              ...prev,
                              dateRange: {
                                ...prev.dateRange,
                                to: value ? new Date(value) : null,
                              },
                            }));
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options de tri et d'organisation */}
        <div className="p-3 border-b border-[color:var(--border)]">
          <div className="flex justify-between items-center">
            {/* Tri */}
            <div className="relative">
              <button
                onClick={() => setShowSortOptions(!showSortOptions)}
                className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded hover:bg-[color:var(--muted)]"
              >
                <ArrowDownUp size={14} />
                <span>Trier</span>
                <ChevronDown
                  size={14}
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
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between items-center ${
                        sortBy === option.id ? "bg-muted" : ""
                      }`}
                      onClick={() => {
                        setSortBy(option.id);
                        setShowSortOptions(false);
                      }}
                    >
                      {option.label}
                      {sortBy === option.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Groupement */}
            <div className="relative">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="text-sm rounded border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-[color:var(--foreground)]"
              >
                <option value="status">Grouper par statut</option>
                <option value="assignee">Grouper par assigné</option>
                <option value="date">Grouper par date</option>
                <option value="type">Grouper par type</option>
                <option value="none">Sans groupement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bouton Nouvelle tâche */}
        <button
          onClick={handleNewTask}
          className="mx-3 mt-3 mb-2 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 transition-colors"
        >
          <Plus size={16} />
          Nouvelle tâche
        </button>

        {/* Liste des tâches avec des groupes */}
        <div className="overflow-y-auto flex-1 py-2 px-1">
          {displayedTasks.length === 0 ? (
            <div className="text-center py-6 text-[color:var(--muted-foreground)] text-sm">
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
                  className="block mx-auto mt-2 text-[color:var(--primary)] hover:underline"
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Affichage par groupes */}
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName} className="mb-1">
                  <div className="px-3 py-1 text-sm font-medium text-[color:var(--muted-foreground)] flex items-center gap-1">
                    {groupBy === "status" && groupName === "À faire" && (
                      <ClipboardList size={14} />
                    )}
                    {groupBy === "status" && groupName === "En cours" && (
                      <Clock size={14} />
                    )}
                    {groupBy === "status" && groupName === "Terminées" && (
                      <CheckCircle2 size={14} />
                    )}
                    {groupBy === "status" && groupName === "Annulées" && (
                      <CircleOff size={14} />
                    )}
                    {groupBy === "assignee" &&
                      groupName === "Non assignées" && <User size={14} />}
                    {groupBy === "date" && <CalendarIcon size={14} />}
                    {groupBy === "type" && <Tag size={14} />}
                    {groupName}{" "}
                    <span className="text-xs ml-1">({groupTasks.length})</span>
                  </div>
                  {groupTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className={cn(
                        "w-full px-3 py-2.5 text-left text-sm transition-colors rounded-md hover:bg-[color:var(--accent)] mb-1",
                        selectedTask?.id === task.id
                          ? "bg-[color:var(--accent)] border-l-4 border-[color:var(--primary)]"
                          : "border-l-4 border-transparent text-[color:var(--foreground)]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium truncate mr-2">
                          {task.name}
                        </div>
                        <div
                          className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusIcon(task.status)}
                          <span>{getStatusName(task.status)}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-xs text-[color:var(--muted-foreground)]">
                        {task.taskType && (
                          <>
                            <Tag size={12} className="mr-1" />
                            <span className="truncate mr-2">
                              {task.taskType}
                            </span>
                          </>
                        )}

                        {task.realizationDate && (
                          <>
                            <Calendar size={12} className="mr-1" />
                            <span className="mr-2">
                              {formatDate(task.realizationDate)}
                            </span>
                          </>
                        )}

                        {task.assignedTo && (
                          <>
                            <User size={12} className="mr-1" />
                            <span className="truncate">
                              {task.assignedTo.name}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Poignée pour redimensionner la sidebar */}
        <div
          ref={resizeDivRef}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-[color:var(--primary)]"
          onMouseDown={startResizing}
        ></div>
      </div>

      {/* Contenu principal */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto bg-[color:var(--background)] p-6"
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
                        backgroundColor: selectedTask.color || "var(--primary)",
                      }}
                    />
                    <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
                      {selectedTask.name}
                    </h1>
                  </div>
                  <div
                    className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${getStatusColor(
                      selectedTask.status
                    )}`}
                  >
                    {getStatusIcon(selectedTask.status)}
                    <span>{getStatusName(selectedTask.status)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="col-span-2 space-y-6">
                    {selectedTask.description && (
                      <div>
                        <h3 className="text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-2">
                          Description
                        </h3>
                        <div className="p-4 bg-[color:var(--muted)] rounded-lg">
                          <p className="whitespace-pre-wrap text-[color:var(--foreground)]">
                            {selectedTask.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTask.executantComment && (
                      <div>
                        <h3 className="text-sm font-medium uppercase text-[color:var(--muted-foreground)] mb-2">
                          Commentaire d&apos;exécution
                        </h3>
                        <div className="p-4 bg-[color:var(--muted)] rounded-lg border-l-4 border-[color:var(--primary)]">
                          <p className="whitespace-pre-wrap text-[color:var(--foreground)]">
                            {selectedTask.executantComment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
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
                              {selectedTask.assignedTo?.name || "Non assigné"}
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
                                {selectedTask.period === "yearly" && "Annuelle"}
                                {selectedTask.endDate &&
                                  ` jusqu'au ${formatDate(
                                    selectedTask.endDate
                                  )}`}
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Section Documents */}
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Paperclip size={18} />
                            Documents
                          </h3>

                          <div className="space-y-6">
                            <DocumentsList
                              taskId={selectedTask.id}
                              onDocumentsChange={() => {
                                // Fonction à appeler quand des changements sont faits à la liste des documents
                                // Par exemple, vous pourriez vouloir mettre à jour d'autres parties de l'interface
                              }}
                            />

                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium mb-2">
                                Ajouter un document
                              </h4>
                              <DocumentUpload
                                taskId={selectedTask.id}
                                onUploadSuccess={() => {
                                  // Rafraîchir la liste des documents après un téléchargement réussi
                                  const documentsList = document.querySelector(
                                    "[data-document-list]"
                                  );
                                  if (documentsList) {
                                    // Vous pourriez implémenter une méthode de rafraîchissement ici
                                    // ou simplement recharger la liste des documents
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
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
                </div>

                <div className="mt-8 flex justify-between">
                  <div className="flex gap-2">
                    {selectedTask.status !== "completed" && (
                      <button
                        onClick={() =>
                          handleTaskStatusChange(selectedTask.id, "completed")
                        }
                        className="px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 rounded-lg transition-colors"
                      >
                        Marquer comme terminée
                      </button>
                    )}
                    {selectedTask.status === "completed" && (
                      <button
                        onClick={() =>
                          handleTaskStatusChange(selectedTask.id, "pending")
                        }
                        className="px-4 py-2 text-sm font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] hover:bg-opacity-90 rounded-lg transition-colors"
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
                      className="px-4 py-2 text-sm font-medium text-[color:var(--secondary-foreground)] bg-[color:var(--secondary)] hover:bg-opacity-90 rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleTaskDelete(selectedTask.id)}
                      className="px-4 py-2 text-sm font-medium text-[color:var(--destructive-foreground)] bg-[color:var(--destructive)] hover:bg-opacity-90 rounded-lg transition-colors"
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
              <div className="w-20 h-20 bg-[color:var(--muted)] rounded-full flex items-center justify-center mb-4">
                <Calendar
                  size={32}
                  className="text-[color:var(--muted-foreground)]"
                />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-[color:var(--foreground)]">
                Gestion des tâches
              </h2>
              <p className="text-[color:var(--muted-foreground)] max-w-md mb-6">
                {articleDescription ||
                  "Sélectionnez une tâche dans la liste ou créez-en une nouvelle pour commencer."}
              </p>
              <button
                onClick={handleNewTask}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-[color:var(--primary-foreground)] bg-[color:var(--primary)] hover:bg-opacity-90 transition-colors"
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
