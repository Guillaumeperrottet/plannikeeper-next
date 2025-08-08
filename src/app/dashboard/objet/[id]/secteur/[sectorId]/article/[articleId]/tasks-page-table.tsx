"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Search,
  X,
  Edit,
  Trash2,
  RefreshCcw,
  Archive,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
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
  documents?: {
    id: string;
    name: string;
    filePath: string;
    fileSize: number;
    fileType: string;
  }[]; // Documents attachés à la tâche (incluant les images)
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
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.filter((task) => !task.archived)
  );

  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(
    articleDescription || ""
  );
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
    images: string[];
    currentIndex: number;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

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
    router.push(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${taskId}`
    );
  };

  const handleImageClick = (
    imageSrc: string,
    taskName: string,
    e: React.MouseEvent,
    allImages: string[],
    currentIndex: number = 0
  ) => {
    e.stopPropagation(); // Empêcher l'ouverture du formulaire de tâche
    setSelectedImage({
      src: imageSrc,
      alt: `Image de la tâche: ${taskName}`,
      images: allImages,
      currentIndex,
    });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedImage || selectedImage.images.length <= 1) return;

      const newIndex =
        direction === "next"
          ? (selectedImage.currentIndex + 1) % selectedImage.images.length
          : (selectedImage.currentIndex - 1 + selectedImage.images.length) %
            selectedImage.images.length;

      setSelectedImage({
        ...selectedImage,
        src: selectedImage.images[newIndex],
        currentIndex: newIndex,
      });
    },
    [selectedImage]
  );

  const handleEditTask = (taskId: string) => {
    router.push(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${taskId}`
    );
  };

  const handleNewTask = () => {
    setSelectedTaskId(null);
    setShowAddForm(true);
  };

  const handleDescriptionEdit = () => {
    setIsEditingDescription(true);
    setEditedDescription(articleDescription || "");
  };

  const handleDescriptionSave = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleTitle,
          description: editedDescription,
          // Garder les autres propriétés existantes si nécessaire
          positionX: 0,
          positionY: 0,
          width: 300,
          height: 200,
        }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour");

      setIsEditingDescription(false);
      toast.success("Description mise à jour avec succès");
      // Optionnel: recharger la page ou mettre à jour l'état local
      window.location.reload();
    } catch {
      toast.error("Échec de la mise à jour de la description");
      setIsEditingDescription(false);
    }
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setEditedDescription(articleDescription || "");
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleDescriptionCancel();
    }
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
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="w-4 h-4" />
      ) : (
        <ArrowDown className="w-4 h-4" />
      );
    }
    // Utiliser l'icône de tri bidirectionnel par défaut
    return <ArrowUpDown className="w-4 h-4 text-gray-300" />;
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression");

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Tâche supprimée avec succès");
    } catch {
      toast.error("Échec de la suppression de la tâche");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir archiver cette tâche ?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) throw new Error("Échec de l'archivage");

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Tâche archivée avec succès");
    } catch {
      toast.error("Échec de l'archivage de la tâche");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour du statut");

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      toast.success("Statut mis à jour avec succès");
    } catch {
      toast.error("Échec de la mise à jour du statut");
    }
  };

  const handleTaskSave = async (
    taskData: Record<string, unknown>,
    documents?: File[]
  ) => {
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

      // Mettre à jour l'interface immédiatement avec la tâche de base
      if (selectedTaskId) {
        setTasks((prev) =>
          prev.map((task) => (task.id === selectedTaskId ? savedTask : task))
        );
        toast.success("Tâche mise à jour avec succès");
      } else {
        setTasks((prev) => [savedTask, ...prev]);
        toast.success("Tâche créée avec succès");
      }

      // Fermer le formulaire immédiatement
      setShowAddForm(false);
      setSelectedTaskId(null);

      // Si des documents sont fournis, les uploader en arrière-plan
      if (documents && documents.length > 0) {
        toast.info(`Upload de ${documents.length} document(s) en cours...`);

        let uploadSuccessCount = 0;
        let uploadErrorCount = 0;

        for (const file of documents) {
          try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch(
              `/api/tasks/${savedTask.id}/documents`,
              {
                method: "POST",
                body: formData,
              }
            );

            if (uploadResponse.ok) {
              uploadSuccessCount++;
            } else {
              uploadErrorCount++;
              console.error(`Échec de l'upload du fichier ${file.name}`);
            }
          } catch (error) {
            uploadErrorCount++;
            console.error("Erreur lors de l'upload du document:", error);
          }
        }

        // Récupérer la tâche mise à jour avec ses documents après tous les uploads
        try {
          const updatedTaskResponse = await fetch(`/api/tasks/${savedTask.id}`);
          if (updatedTaskResponse.ok) {
            const updatedTask = await updatedTaskResponse.json();
            setTasks((prev) =>
              prev.map((task) =>
                task.id === savedTask.id ? updatedTask : task
              )
            );
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de la tâche mise à jour:",
            error
          );
        }

        // Afficher un résumé des uploads
        if (uploadErrorCount === 0) {
          toast.success(
            `Tous les documents ont été uploadés avec succès (${uploadSuccessCount})`
          );
        } else if (uploadSuccessCount > 0) {
          toast.warning(
            `${uploadSuccessCount} document(s) uploadé(s), ${uploadErrorCount} échec(s)`
          );
        } else {
          toast.error(
            `Échec de l'upload de tous les documents (${uploadErrorCount})`
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
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

  // Focus on description input when editing starts
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage) {
        if (e.key === "Escape") {
          closeImageModal();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigateImage("prev");
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          navigateImage("next");
        }
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown);
      // Empêcher le scroll de la page quand la modal est ouverte
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage, navigateImage]);

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
            variant: "pending" as const,
          };
        case "in_progress":
          return {
            text: "En cours",
            variant: "inProgress" as const,
          };
        case "completed":
          return {
            text: "Terminé",
            variant: "completed" as const,
          };
        case "cancelled":
          return {
            text: "Annulé",
            variant: "cancelled" as const,
          };
        default:
          return {
            text: "À faire",
            variant: "pending" as const,
          };
      }
    };

    const config = getStatusConfig(status);

    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area with integrated filter area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden flex flex-col md:flex-row"
      >
        {showAddForm && (
          <TaskForm
            task={getSelectedTask()}
            users={users}
            onSave={handleTaskSave}
            onCancel={() => {
              setShowAddForm(false);
              setSelectedTaskId(null);
            }}
          />
        )}

        {!showAddForm && (
          <div className="flex-1 flex flex-col">
            {/* Clean header like dashboard */}
            <div className="px-4 md:px-6 py-4">
              {/* Desktop layout - original design */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {articleTitle}
                    </h1>
                    {isEditingDescription ? (
                      <div className="mt-1 max-w-sm">
                        <Input
                          ref={descriptionInputRef}
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          onKeyDown={handleDescriptionKeyDown}
                          onBlur={handleDescriptionSave}
                          placeholder="Ajouter une description..."
                          className="text-sm border-gray-200 focus:border-gray-400"
                        />
                      </div>
                    ) : (
                      <p
                        className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700 transition-colors"
                        onClick={handleDescriptionEdit}
                        title="Cliquer pour modifier"
                      >
                        {articleDescription || "Ajouter une description..."}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Rechercher par nom, statut ou autre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-8 border-gray-200 transition-all duration-200 ${
                          searchQuery && searchQuery.length > 20
                            ? "w-96"
                            : searchQuery && searchQuery.length > 10
                              ? "w-80"
                              : "w-72"
                        }`}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleNewTask}
                      className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Nouvelle tâche
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile layout - responsive design */}
              <div className="md:hidden">
                <div className="mb-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {articleTitle}
                  </h1>
                  {isEditingDescription ? (
                    <div className="mt-1">
                      <Input
                        ref={descriptionInputRef}
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        onKeyDown={handleDescriptionKeyDown}
                        onBlur={handleDescriptionSave}
                        placeholder="Ajouter une description..."
                        className="text-sm border-gray-200 focus:border-gray-400"
                      />
                    </div>
                  ) : (
                    <p
                      className="text-sm text-gray-500 mt-1 cursor-pointer hover:text-gray-700 transition-colors"
                      onClick={handleDescriptionEdit}
                      title="Cliquer pour modifier"
                    >
                      {articleDescription || "Ajouter une description..."}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher par nom, statut ou autre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-8 border-gray-200 w-full"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleNewTask}
                    className="gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle
                  </Button>
                </div>
              </div>

              {/* Filter buttons like dashboard */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setActiveFilter("pending")}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeFilter === "pending"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  À faire
                </button>
                <button
                  onClick={() => setActiveFilter("in_progress")}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeFilter === "in_progress"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setActiveFilter("completed")}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeFilter === "completed"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Terminées
                </button>
                <button
                  onClick={() => setActiveFilter("cancelled")}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeFilter === "cancelled"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annulées
                </button>

                {/* Archive button for completed tasks */}
                {filteredTasks.some((task) => task.status === "completed") && (
                  <div className="ml-4 pl-4 border-l border-gray-300">
                    <ArchiveCompletedButton
                      completedTasks={filteredTasks.filter(
                        (task) => task.status === "completed"
                      )}
                      onArchiveCompleted={handleBulkArchiveCompleted}
                    />
                  </div>
                )}

                <div className="ml-auto text-sm text-gray-500">
                  {filteredTasks.length} résultats
                </div>
              </div>

              {/* Mobile filter buttons - responsive scroll */}
              <div className="md:hidden">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        activeFilter === "all"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Toutes
                    </button>
                    <button
                      onClick={() => setActiveFilter("pending")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        activeFilter === "pending"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      À faire
                    </button>
                    <button
                      onClick={() => setActiveFilter("in_progress")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        activeFilter === "in_progress"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => setActiveFilter("completed")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        activeFilter === "completed"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Terminées
                    </button>
                    <button
                      onClick={() => setActiveFilter("cancelled")}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                        activeFilter === "cancelled"
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Annulées
                    </button>

                    {/* Archive button for completed tasks */}
                    {filteredTasks.some(
                      (task) => task.status === "completed"
                    ) && (
                      <div className="ml-2 pl-2 border-l border-gray-300">
                        <ArchiveCompletedButton
                          completedTasks={filteredTasks.filter(
                            (task) => task.status === "completed"
                          )}
                          onArchiveCompleted={handleBulkArchiveCompleted}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count for mobile */}
                <div className="text-sm text-gray-500 mb-2">
                  {filteredTasks.length} résultats
                </div>
              </div>
            </div>

            {/* Clean table like dashboard */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[120px] text-xs font-medium text-gray-500 py-3 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("status")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        STATUT
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[280px] text-xs font-medium text-gray-500 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("name")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        TÂCHE
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] text-xs font-medium text-gray-500 py-3">
                      IMAGE
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-medium text-gray-500 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("assignedTo")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        ASSIGNÉ À{getSortIcon("assignedTo")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-medium text-gray-500 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("taskType")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        TYPE
                        {getSortIcon("taskType")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-medium text-gray-500 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("createdAt")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        CRÉÉ LE
                        {getSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-medium text-gray-500 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("realizationDate")}
                        className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        ÉCHÉANCE
                        {getSortIcon("realizationDate")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[80px] text-xs font-medium text-gray-500 py-3">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Search className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium">
                            {searchQuery
                              ? "Aucune tâche trouvée"
                              : "Aucune tâche pour le moment"}
                          </p>
                          {!searchQuery && (
                            <p className="text-xs text-gray-400">
                              Commencez par créer votre première tâche
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <TableCell className="py-3 px-6 w-[120px]">
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell className="py-3 w-[280px] max-w-[280px]">
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                              <span className="truncate" title={task.name}>
                                {task.name}
                              </span>
                              {task.recurring && (
                                <RefreshCcw className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                            {task.description && (
                              <div
                                className="text-xs text-gray-500 line-clamp-2 truncate"
                                title={task.description}
                              >
                                {task.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 w-[100px]">
                          <div className="flex items-center">
                            {(() => {
                              // Filtrer les documents qui sont des images
                              const imageDocuments =
                                task.documents?.filter((doc) =>
                                  doc.fileType.startsWith("image/")
                                ) || [];

                              if (imageDocuments.length > 0) {
                                const imageUrls = imageDocuments.map(
                                  (doc) => doc.filePath
                                );
                                return (
                                  <div className="relative">
                                    <div
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={(e) =>
                                        handleImageClick(
                                          imageDocuments[0].filePath,
                                          task.name,
                                          e,
                                          imageUrls,
                                          0
                                        )
                                      }
                                    >
                                      <Image
                                        src={imageDocuments[0].filePath}
                                        alt="Task preview"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-cover rounded border border-gray-200"
                                        onError={() => {
                                          console.log(
                                            "Image failed to load:",
                                            imageDocuments[0].filePath
                                          );
                                        }}
                                      />
                                    </div>
                                    {imageDocuments.length > 1 && (
                                      <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        +{imageDocuments.length - 1}
                                      </span>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-gray-900">
                            {task.assignedTo
                              ? task.assignedTo.name
                              : "Non assigné"}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-gray-900">
                            {task.taskType || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-gray-500">
                            {formatDate(task.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm text-gray-500">
                            {formatDate(task.realizationDate) || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task.id);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>
                                Changer le statut
                              </DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, "pending");
                                }}
                                className={
                                  task.status === "pending"
                                    ? "text-blue-600 bg-blue-50"
                                    : ""
                                }
                              >
                                À faire{" "}
                                {task.status === "pending" && (
                                  <Check className="w-4 h-4 ml-auto" />
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, "in_progress");
                                }}
                                className={
                                  task.status === "in_progress"
                                    ? "text-blue-600 bg-blue-50"
                                    : ""
                                }
                              >
                                En cours{" "}
                                {task.status === "in_progress" && (
                                  <Check className="w-4 h-4 ml-auto" />
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, "completed");
                                }}
                                className={
                                  task.status === "completed"
                                    ? "text-blue-600 bg-blue-50"
                                    : ""
                                }
                              >
                                Terminé{" "}
                                {task.status === "completed" && (
                                  <Check className="w-4 h-4 ml-auto" />
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, "cancelled");
                                }}
                                className={
                                  task.status === "cancelled"
                                    ? "text-blue-600 bg-blue-50"
                                    : ""
                                }
                              >
                                Annulé{" "}
                                {task.status === "cancelled" && (
                                  <Check className="w-4 h-4 ml-auto" />
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveTask(task.id);
                                }}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archiver
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation buttons - only show if there are multiple images */}
            {selectedImage.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("prev");
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-3 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage("next");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-3 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {selectedImage.currentIndex + 1} /{" "}
                  {selectedImage.images.length}
                </div>
              </>
            )}

            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
