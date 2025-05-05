"use client";

import DocumentsList from "./documents-list";
import DocumentUpload from "./document-upload";
import TaskComments from "./TaskComments";
import { useState, useRef, useEffect } from "react";
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
  ArrowLeft,
  ArrowDownUp,
  Check,
  X,
  Tag,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  ClipboardList,
  CircleOff,
  LayoutList,
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
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // État pour le mode mobile
  const [isMobileView, setIsMobileView] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

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

  // Effet pour détecter les appareils mobiles
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Vérification initiale
    checkIfMobile();

    // Écouter les changements de taille d'écran
    window.addEventListener("resize", checkIfMobile);

    // Nettoyage
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Cacher automatiquement la sidebar en mode mobile si une tâche est sélectionnée
  useEffect(() => {
    if (isMobileView && (selectedTask || showAddForm)) {
      setShowSidebar(false);
    }
  }, [selectedTask, showAddForm, isMobileView]);

  // Effet pour extraire tous les types de tâches uniques
  useEffect(() => {
    const types = new Set<string>();
    tasks.forEach((task) => {
      if (task.taskType) types.add(task.taskType);
    });
    setTaskTypes(Array.from(types).sort());
  }, [tasks]);

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
      // Check if the task ID already exists in the state to determine if it's new
      const isNewTask = !tasks.some((t) => t.id === updatedTask.id);

      // Pour une nouvelle tâche
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

        // Uploader les documents si présents
        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(newTask.id, documents);
        }
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

        // Uploader les documents si présents
        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(updated.id, documents);
        }
      }

      setSelectedTask(null);
      setShowAddForm(false);
      // Revenir à la liste de tâches en mobile après la création/modification
      if (isMobileView) {
        setShowSidebar(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  // Fonction d'upload de documents pour une tâche
  const uploadDocumentsForTask = async (taskId: string, documents: File[]) => {
    try {
      // Upload des documents un par un
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

      // Attendre que tous les uploads soient terminés
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
        Object.entries(groups).filter(([tasks]) => tasks.length > 0)
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
        Object.entries(groups).filter(([tasks]) => tasks.length > 0)
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
        Object.entries(groups).filter(([tasks]) => tasks.length > 0)
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
        Object.entries(groups).filter(([tasks]) => tasks.length > 0)
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[color:var(--background)]">
      {/* Barre de navigation mobile - visible uniquement sur mobile */}
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
        {/* Sidebar des tâches - Adaptée pour mobile */}
        {(showSidebar || !isMobileView) && (
          <div
            className={`${
              isMobileView
                ? "absolute inset-0 z-20 bg-[color:var(--background)]"
                : "relative w-96 flex-shrink-0"
            } border-r border-[color:var(--border)] bg-[color:var(--card)] flex flex-col`}
          >
            {!isMobileView && (
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
            )}

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
                        <h3 className="font-medium text-xs sm:text-sm">
                          Filtres avancés
                        </h3>
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
                          {[
                            "pending",
                            "in_progress",
                            "completed",
                            "cancelled",
                          ].map((status) => (
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
                          ))}
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

            {/* Options de tri et d'organisation - Optimisées pour mobile */}
            <div className="p-3 border-b border-[color:var(--border)]">
              <div className="flex justify-between items-center">
                {/* Tri */}
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

                {/* Groupement */}
                <div className="relative">
                  <select
                    value={groupBy}
                    onChange={(e) =>
                      setGroupBy(
                        e.target.value as
                          | "status"
                          | "assignee"
                          | "date"
                          | "type"
                          | "none"
                      )
                    }
                    className="text-xs sm:text-sm rounded border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-[color:var(--foreground)]"
                  >
                    <option value="status">Par statut</option>
                    <option value="assignee">Par assigné</option>
                    <option value="date">Par date</option>
                    <option value="type">Par type</option>
                    <option value="none">Sans groupe</option>
                  </select>
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

            {/* Liste des tâches avec des groupes */}
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
                <div className="space-y-3 sm:space-y-4">
                  {/* Affichage par groupes */}
                  {Object.entries(groupedTasks).map(
                    ([groupName, groupTasks]) => (
                      <div key={groupName} className="mb-1">
                        <div className="px-3 py-1 text-xs sm:text-sm font-medium text-[color:var(--muted-foreground)] flex items-center gap-1">
                          {groupBy === "status" && groupName === "À faire" && (
                            <ClipboardList
                              size={12}
                              className="sm:w-4 sm:h-4"
                            />
                          )}
                          {groupBy === "status" && groupName === "En cours" && (
                            <Clock size={12} className="sm:w-4 sm:h-4" />
                          )}
                          {groupBy === "status" &&
                            groupName === "Terminées" && (
                              <CheckCircle2
                                size={12}
                                className="sm:w-4 sm:h-4"
                              />
                            )}
                          {groupBy === "status" && groupName === "Annulées" && (
                            <CircleOff size={12} className="sm:w-4 sm:h-4" />
                          )}
                          {groupBy === "assignee" &&
                            groupName === "Non assignées" && (
                              <User size={12} className="sm:w-4 sm:h-4" />
                            )}
                          {groupBy === "date" && (
                            <CalendarIcon size={12} className="sm:w-4 sm:h-4" />
                          )}
                          {groupBy === "type" && (
                            <Tag size={12} className="sm:w-4 sm:h-4" />
                          )}
                          {groupName}{" "}
                          <span className="text-[10px] sm:text-xs ml-1">
                            ({groupTasks.length})
                          </span>
                        </div>
                        {groupTasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className={cn(
                              "w-full px-3 py-2 text-left text-xs sm:text-sm transition-colors rounded-md hover:bg-[color:var(--accent)] mb-1",
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
                                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full flex items-center gap-1 ${getStatusColor(
                                  task.status
                                )}`}
                              >
                                {getStatusIcon(task.status)}
                                <span className="hidden xs:inline">
                                  {getStatusName(task.status)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center text-[10px] sm:text-xs text-[color:var(--muted-foreground)] gap-2">
                              {task.taskType && (
                                <span className="flex items-center">
                                  <Tag
                                    size={10}
                                    className="mr-1 sm:w-3 sm:h-3"
                                  />
                                  <span className="truncate">
                                    {task.taskType}
                                  </span>
                                </span>
                              )}

                              {task.realizationDate && (
                                <span className="flex items-center">
                                  <Calendar
                                    size={10}
                                    className="mr-1 sm:w-3 sm:h-3"
                                  />
                                  <span>
                                    {formatDate(task.realizationDate)}
                                  </span>
                                </span>
                              )}

                              {task.assignedTo && (
                                <span className="flex items-center">
                                  <User
                                    size={10}
                                    className="mr-1 sm:w-3 sm:h-3"
                                  />
                                  <span className="truncate">
                                    {task.assignedTo.name}
                                  </span>
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Bouton de fermeture pour mobile - En bas de la sidebar */}
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
          {/* Barre de navigation pour mobile - uniquement pour les détails de tâche en mode mobile */}
          {isMobileView && (selectedTask || showAddForm) && (
            <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] p-3 flex items-center">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setShowAddForm(false);
                  setShowSidebar(true);
                }}
                className="mr-2 p-1 rounded-full hover:bg-[color:var(--muted)]"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="font-medium text-sm">
                {showAddForm ? "Nouvelle tâche" : selectedTask?.name}
              </h1>
            </div>
          )}

          <AnimatePresence mode="wait">
            {showAddForm ? (
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
            ) : selectedTask ? (
              <motion.div
                key={selectedTask.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-auto p-3 sm:p-6 pb-28 sm:pb-6" // Ajout de padding-bottom important pour mobile
              >
                <div className="max-w-3xl mx-auto flex flex-col">
                  {/* Entête avec le nom de la tâche et le statut - pour desktop seulement */}
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

                  {/* Contenu principal - réorganisé pour mieux utiliser l'espace */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 min-h-0">
                    <div className="col-span-3 md:col-span-2 space-y-3 sm:space-y-4 overflow-auto">
                      <div
                        className={`flex ${!isMobileView ? "hidden" : "flex"} items-center gap-2 mb-2`}
                      >
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

                      {/* Information cards for mobile */}
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

                      {/* Section Documents - compactée */}
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
                                onDocumentsChange={() => {
                                  // Fonction à appeler quand des changements sont faits
                                }}
                              />
                            </div>
                            <div className="mt-2">
                              <h4 className="text-xs sm:text-sm font-medium mb-1">
                                Ajouter
                              </h4>
                              <DocumentUpload
                                taskId={selectedTask.id}
                                onUploadSuccess={() => {
                                  // Rafraîchir après upload réussi
                                }}
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
                          // Add logic to open the edit form
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
                  <div className="bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-20 flex gap-2">
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
