"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Paperclip,
  Edit,
  Trash2,
  MoreVertical,
  User,
  Save,
  RefreshCcw,
  Archive,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import DocumentsList from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/documents-list";
import DocumentUpload from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/document-upload";
import TaskComments from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/TaskComments";

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
  recurrenceReminderDate?: Date | null;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
  article: {
    id: string;
    title: string;
    sector: {
      id: string;
      name: string;
      object: {
        id: string;
        nom: string;
      };
    };
  };
};

interface ModernTaskDetailPageProps {
  task: Task;
  users: User[];
  objetId: string;
  sectorId: string;
  articleId: string;
  readonly?: boolean;
}

export default function ModernTaskDetailPage({
  task: initialTask,
  users,
  objetId,
  sectorId,
  articleId,
  readonly = false,
}: ModernTaskDetailPageProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false && !readonly);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [activeTab, setActiveTab] = useState<
    "details" | "documents" | "comments"
  >("details");

  // Detect mobile screen size
  const isMobile =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false;

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString();
  };

  // Get status display information
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "À faire",
          icon: <Clock className="h-4 w-4" />,
          variant: "pending" as const,
        };
      case "in_progress":
        return {
          label: "En cours",
          icon: <Clock className="h-4 w-4" />,
          variant: "inProgress" as const,
        };
      case "completed":
        return {
          label: "Terminée",
          icon: <CheckCircle2 className="h-4 w-4" />,
          variant: "completed" as const,
        };
      case "cancelled":
        return {
          label: "Annulée",
          icon: <X className="h-4 w-4" />,
          variant: "cancelled" as const,
        };
      default:
        return {
          label: status,
          icon: <AlertCircle className="h-4 w-4" />,
          variant: "pending" as const,
        };
    }
  };

  // Handle task edit/save
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedTask),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const updated = await response.json();
      setTask(updated);
      setIsEditing(false);
      toast.success("Tâche mise à jour avec succès");
    } catch {
      toast.error("Erreur lors de la mise à jour de la tâche");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Tâche supprimée avec succès");
      router.push(
        `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`
      );
    } catch {
      toast.error("Erreur lors de la suppression de la tâche");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const updated = await response.json();
      setTask(updated);
      toast.success("Statut mis à jour avec succès");
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setIsLoading(false);
    }
  };

  // Get period label
  const getPeriodLabel = (period: string | null) => {
    if (!period) return "";

    switch (period) {
      case "daily":
        return "Quotidienne";
      case "weekly":
        return "Hebdomadaire";
      case "monthly":
        return "Mensuelle";
      case "quarterly":
        return "Trimestrielle";
      case "yearly":
        return "Annuelle";
      default:
        return period;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Bannière pour mode lecture seule */}
        {readonly && (
          <div className="bg-blue-50 dark:bg-blue-950 border-y border-blue-200 dark:border-blue-800 py-3">
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
              <Archive className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1">
                <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
                  Mode consultation - Tâche archivée
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  Cette tâche est archivée et ne peut pas être modifiée. Pour la
                  modifier, veuillez d&apos;abord la désarchiver.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bannière pour tâches archivées */}
        {task.archived && !readonly && (
          <div className="bg-warning/10 border-y border-warning/20 py-3">
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
              <Archive className="h-4 w-4 text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-warning-foreground font-medium text-sm">
                  Tâche archivée
                </p>
                <p className="text-muted-foreground text-xs">
                  Cette tâche est archivée et n&apos;apparaît plus dans les
                  listes actives.
                  {task.status === "completed" &&
                    " Elle a été marquée comme terminée."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Fonction pour désarchiver
                  fetch(`/api/tasks/${task.id}/archive`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ archive: false }),
                  })
                    .then((response) => {
                      if (!response.ok)
                        throw new Error("Échec de la mise à jour");
                      return response.json();
                    })
                    .then(() => {
                      setTask({ ...task, archived: false });
                      toast.success("Tâche retirée des archives");
                    })
                    .catch((error) => {
                      console.error("Erreur:", error);
                      toast.error("Erreur lors de la désarchivation");
                    });
                }}
                className="shrink-0 text-xs h-7"
              >
                Désarchiver
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-3">
          {/* Breadcrumb navigation simple */}
          <div className="mb-4">
            <Link
              href={`/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Retour à l&apos;article</span>
              <span className="sm:hidden">Retour</span>
            </Link>
          </div>

          {/* Navigation avec Tabs pour mobile et desktop */}
          <div className="sm:hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "details" | "documents" | "comments")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="comments">Commentaires</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content area - layout optimisé pour voir plus en une page */}
          <div className="space-y-4">
            {/* Section principale - informations et contenu */}
            {(activeTab === "details" || !isMobile) && (
              <div className="space-y-4">
                {/* Informations principales - pleine largeur */}
                <div className="space-y-4">
                  {/* Carte principale avec toutes les informations */}
                  <Card>
                    <CardHeader className="pb-4">
                      {/* Titre principal avec badge couleur et actions */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  task.color || "hsl(var(--primary))",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editedTask.name}
                                  onChange={(e) =>
                                    setEditedTask({
                                      ...editedTask,
                                      name: e.target.value,
                                    })
                                  }
                                  className="text-xl font-bold bg-transparent border-b border-t-0 border-x-0 border-input focus:border-ring rounded-none px-0 h-auto py-1"
                                  autoFocus
                                />
                              ) : (
                                <CardTitle className="text-xl font-bold text-foreground leading-tight m-0 p-0">
                                  {task.name}
                                </CardTitle>
                              )}
                            </div>
                          </div>

                          {/* Badges statut et informations */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant={getStatusInfo(task.status).variant}
                                  className="gap-1.5 text-xs h-6 px-2.5"
                                >
                                  {getStatusInfo(task.status).icon}
                                  {getStatusInfo(task.status).label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Statut actuel de la tâche</p>
                              </TooltipContent>
                            </Tooltip>

                            {task.taskType && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs h-6 px-2.5"
                                  >
                                    {task.taskType}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Type de tâche</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {task.recurring && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className="gap-1.5 text-xs h-6 px-2.5"
                                  >
                                    <RefreshCcw size={11} />
                                    {getPeriodLabel(task.period)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Tâche récurrente - se répète automatiquement
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {task.assignedTo && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className="gap-1.5 text-xs h-6 px-2.5"
                                  >
                                    <User size={11} />
                                    {task.assignedTo.name}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Assigné à {task.assignedTo.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Actions côté droit */}
                        <div className="flex items-center gap-2 shrink-0">
                          {readonly ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Archive className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Tâche archivée - Lecture seule
                              </span>
                            </div>
                          ) : !isEditing ? (
                            <>
                              {/* Quick status change button */}
                              {task.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange("completed")
                                  }
                                  disabled={isLoading}
                                  className="gap-1.5 h-8 text-xs"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Marquer comme terminée
                                  </span>
                                  <span className="sm:hidden">Terminée</span>
                                </Button>
                              )}

                              {task.status === "in_progress" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange("completed")
                                  }
                                  disabled={isLoading}
                                  className="gap-1.5 h-8 text-xs"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Marquer comme terminée
                                  </span>
                                  <span className="sm:hidden">Terminée</span>
                                </Button>
                              )}

                              {task.status === "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange("pending")}
                                  disabled={isLoading}
                                  className="gap-1.5 h-8 text-xs"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Remettre à faire
                                  </span>
                                  <span className="sm:hidden">À faire</span>
                                </Button>
                              )}

                              {task.status === "cancelled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange("pending")}
                                  disabled={isLoading}
                                  className="gap-1.5 h-8 text-xs"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    Remettre à faire
                                  </span>
                                  <span className="sm:hidden">À faire</span>
                                </Button>
                              )}

                              {/* Desktop action buttons */}
                              <div className="hidden sm:flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setIsEditing(true)}
                                      className="h-8 px-2.5 text-xs"
                                    >
                                      <Edit size={14} className="mr-1.5" />
                                      Modifier
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Modifier les détails de la tâche</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={handleDelete}
                                      className="h-8 px-2.5 text-xs"
                                    >
                                      <Trash2 size={14} className="mr-1.5" />
                                      Supprimer
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Supprimer définitivement la tâche</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              {/* Mobile action menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="sm:hidden h-8 w-8 p-0"
                                    aria-label="Plus d'options"
                                  >
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* Quick status actions */}
                                  {task.status === "pending" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange("completed")
                                      }
                                      disabled={isLoading}
                                    >
                                      <CheckCircle2
                                        size={14}
                                        className="mr-2"
                                      />
                                      Marquer comme terminée
                                    </DropdownMenuItem>
                                  )}

                                  {task.status === "in_progress" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange("completed")
                                      }
                                      disabled={isLoading}
                                    >
                                      <CheckCircle2
                                        size={14}
                                        className="mr-2"
                                      />
                                      Marquer comme terminée
                                    </DropdownMenuItem>
                                  )}

                                  {task.status === "completed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange("pending")
                                      }
                                      disabled={isLoading}
                                    >
                                      <Clock size={14} className="mr-2" />
                                      Remettre à faire
                                    </DropdownMenuItem>
                                  )}

                                  {task.status === "cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange("pending")
                                      }
                                      disabled={isLoading}
                                    >
                                      <Clock size={14} className="mr-2" />
                                      Remettre à faire
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem
                                    onClick={() => setIsEditing(true)}
                                  >
                                    <Edit size={14} className="mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : readonly ? null : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isLoading}
                                className="h-8 px-2.5 text-xs"
                              >
                                <X size={14} className="mr-1.5" />
                                <span className="hidden sm:inline">
                                  Annuler
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isLoading}
                                className="h-8 px-2.5 text-xs"
                              >
                                <Save size={14} className="mr-1.5" />
                                <span className="hidden sm:inline">
                                  Enregistrer
                                </span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Échéance */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground block">
                              Échéance
                            </Label>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={
                                  editedTask.realizationDate
                                    ? new Date(
                                        typeof editedTask.realizationDate ===
                                          "string" ||
                                        editedTask.realizationDate instanceof
                                          Date
                                          ? editedTask.realizationDate
                                          : ""
                                      )
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  setEditedTask({
                                    ...editedTask,
                                    realizationDate: e.target.value
                                      ? new Date(e.target.value)
                                      : null,
                                  })
                                }
                                className="h-7 text-xs mt-1"
                              />
                            ) : (
                              <div className="text-xs font-medium text-foreground">
                                {formatDate(task.realizationDate)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Assigné à */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-accent/10 rounded">
                            <User className="w-4 h-4 text-accent-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground block">
                              Assigné à
                            </Label>
                            {isEditing ? (
                              <Select
                                value={editedTask.assignedToId || "unassigned"}
                                onValueChange={(value) =>
                                  setEditedTask({
                                    ...editedTask,
                                    assignedToId:
                                      value === "unassigned" ? null : value,
                                  })
                                }
                              >
                                <SelectTrigger className="w-full h-7 text-xs mt-1">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    Non assigné
                                  </SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="text-xs font-medium text-foreground">
                                {task.assignedTo?.name || (
                                  <span className="text-muted-foreground italic">
                                    Non assigné
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Récurrence */}
                        {task.recurring && (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded">
                              <RefreshCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground block">
                                Récurrence
                              </Label>
                              <div className="text-xs font-medium text-foreground">
                                {getPeriodLabel(task.period)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted/50 rounded">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground block">
                              Modifiée
                            </Label>
                            <div className="text-xs font-medium text-foreground">
                              {formatDate(task.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section Description intégrée */}
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="mb-3">
                          <Label className="text-sm font-medium text-foreground">
                            Description
                          </Label>
                        </div>
                        {isEditing ? (
                          <Textarea
                            value={editedTask.description || ""}
                            onChange={(e) =>
                              setEditedTask({
                                ...editedTask,
                                description: e.target.value,
                              })
                            }
                            placeholder="Ajouter une description..."
                            className="min-h-[80px] text-sm"
                          />
                        ) : (
                          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[60px] bg-muted/30 rounded-md p-3">
                            {task.description || (
                              <span className="text-muted-foreground italic">
                                Aucune description
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration récurrence en mode édition - pleine largeur */}
                  {isEditing && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4 text-primary" />
                          Configuration de la récurrence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="recurring-edit"
                              checked={editedTask.recurring}
                              onChange={(e) =>
                                setEditedTask({
                                  ...editedTask,
                                  recurring: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
                            />
                            <Label
                              htmlFor="recurring-edit"
                              className="ml-2 text-sm font-medium"
                            >
                              Tâche récurrente
                            </Label>
                          </div>

                          {editedTask.recurring && (
                            <>
                              <div>
                                <Label className="text-xs font-medium mb-1 block">
                                  Périodicité
                                </Label>
                                <Select
                                  value={editedTask.period || "weekly"}
                                  onValueChange={(value) =>
                                    setEditedTask({
                                      ...editedTask,
                                      period: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-full h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">
                                      Quotidienne
                                    </SelectItem>
                                    <SelectItem value="weekly">
                                      Hebdomadaire
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                      Mensuelle
                                    </SelectItem>
                                    <SelectItem value="quarterly">
                                      Trimestrielle
                                    </SelectItem>
                                    <SelectItem value="yearly">
                                      Annuelle
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs font-medium mb-1 block">
                                  Date de fin
                                </Label>
                                <Input
                                  type="date"
                                  value={
                                    editedTask.endDate
                                      ? new Date(
                                          editedTask.endDate instanceof Date
                                            ? editedTask.endDate
                                            : new Date(editedTask.endDate)
                                        )
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) =>
                                    setEditedTask({
                                      ...editedTask,
                                      endDate: e.target.value
                                        ? new Date(e.target.value)
                                        : null,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Commentaire d'exécution et récurrence côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Commentaire d'exécution */}
                  {(task.executantComment || isEditing) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Commentaire d&apos;exécution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditing ? (
                          <Textarea
                            value={editedTask.executantComment || ""}
                            onChange={(e) =>
                              setEditedTask({
                                ...editedTask,
                                executantComment: e.target.value,
                              })
                            }
                            placeholder="Commentaire sur l'exécution..."
                            className="min-h-[100px] text-sm"
                          />
                        ) : (
                          <div className="text-sm text-foreground border-l-2 border-accent pl-3 py-1 bg-accent/5 rounded-r whitespace-pre-wrap leading-relaxed min-h-[100px]">
                            {task.executantComment}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Bloc récurrence détaillé - compact */}
                  {task.recurring && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <RefreshCcw className="h-4 w-4 text-primary" />
                          Récurrence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded border border-accent/20">
                            <Badge variant="secondary" className="text-xs mb-2">
                              {task.period === "daily" && "Quotidienne"}
                              {task.period === "weekly" && "Hebdomadaire"}
                              {task.period === "monthly" && "Mensuelle"}
                              {task.period === "quarterly" && "Trimestrielle"}
                              {task.period === "yearly" && "Annuelle"}
                            </Badge>
                            {task.realizationDate && (
                              <div className="text-xs text-muted-foreground">
                                Prochaine: {formatDate(task.realizationDate)}
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                            <p className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              Une nouvelle instance sera créée automatiquement
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Documents et commentaires côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Documents section compacte */}
                  {(activeTab === "documents" || !isMobile) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <DocumentsList
                            taskId={task.id}
                            onDocumentsChange={() => {}}
                          />
                          {!readonly && (
                            <div className="border-t border-border pt-4">
                              <DocumentUpload
                                taskId={task.id}
                                onUploadSuccess={() => {}}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Comments section compacte */}
                  {(activeTab === "comments" || !isMobile) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Commentaires
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TaskComments taskId={task.id} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
