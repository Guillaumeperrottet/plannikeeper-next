"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
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
}

export default function ModernTaskDetailPage({
  task: initialTask,
  users,
  objetId,
  sectorId,
  articleId,
}: ModernTaskDetailPageProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [activeTab, setActiveTab] = useState<
    "details" | "documents" | "comments"
  >("details");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

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
          color: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "in_progress":
        return {
          label: "En cours",
          icon: <Clock className="h-4 w-4 text-blue-500" />,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "completed":
        return {
          label: "Terminée",
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "cancelled":
        return {
          label: "Annulée",
          icon: <X className="h-4 w-4 text-red-500" />,
          color: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          label: status,
          icon: <AlertCircle className="h-4 w-4" />,
          color: "bg-gray-100 text-gray-700 border-gray-300",
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
    setShowStatusDropdown(false);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed header with actions */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}`}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline font-medium">Retour</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`${getStatusInfo(task.status).color} border`}
                  >
                    <div className="flex items-center gap-1">
                      {getStatusInfo(task.status).icon}
                      <span className="ml-1">
                        {getStatusInfo(task.status).label}
                      </span>
                    </div>
                  </Button>

                  {/* Status dropdown */}
                  <AnimatePresence>
                    {showStatusDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden"
                      >
                        {[
                          "pending",
                          "in_progress",
                          "completed",
                          "cancelled",
                        ].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-1.5 ${
                              task.status === status
                                ? "font-medium bg-gray-50"
                                : ""
                            }`}
                            disabled={isLoading}
                          >
                            {getStatusInfo(status).icon}
                            <span>{getStatusInfo(status).label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action menu (mobile) */}
                <div className="relative sm:hidden">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Plus d'options"
                  >
                    <MoreVertical size={20} />
                  </button>

                  <AnimatePresence>
                    {showActionMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <Edit size={16} />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-1.5"
                        >
                          <Trash2 size={16} />
                          <span>Supprimer</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Desktop action buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit size={16} className="mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Supprimer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  <X size={16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                  <Save size={16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Enregistrer</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 md:py-6">
        {/* Task title and badges */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
              style={{ backgroundColor: task.color || "#6366f1" }}
            />
            {isEditing ? (
              <input
                type="text"
                value={editedTask.name}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, name: e.target.value })
                }
                className="text-xl sm:text-2xl font-bold w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:ring-0 outline-none px-0"
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold">{task.name}</h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-6">
            {task.taskType && (
              <span className="px-2 py-0.5 text-xs sm:text-sm rounded-full bg-gray-100 text-gray-700">
                {task.taskType}
              </span>
            )}
            {task.recurring && (
              <span className="px-2 py-0.5 text-xs sm:text-sm rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                <RefreshCcw size={12} />
                <span>{getPeriodLabel(task.period)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab navigation for mobile */}
        <div className="mb-6 border-b sm:hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-2 px-1 text-sm font-medium ${
                activeTab === "details"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Détails
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 py-2 px-1 text-sm font-medium ${
                activeTab === "documents"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`flex-1 py-2 px-1 text-sm font-medium ${
                activeTab === "comments"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Commentaires
            </button>
          </div>
        </div>

        {/* Content area - responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Task details panel - always visible on desktop, conditionally on mobile */}
          {(activeTab === "details" || !isMobile) && (
            <div className="md:col-span-2 space-y-6">
              {/* Bloc édition récurrence (avant la description) */}
              {isEditing && (
                <div className="mb-6">
                  <div className="flex items-center mb-2">
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
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="recurring-edit"
                      className="ml-2 text-sm font-medium"
                    >
                      Tâche récurrente
                    </label>
                  </div>
                  {editedTask.recurring && (
                    <div className="ml-6 mt-2 space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Périodicité
                        </label>
                        <select
                          value={editedTask.period || "weekly"}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              period: e.target.value,
                            })
                          }
                          className="w-full p-2 border rounded-md text-sm"
                        >
                          <option value="daily">Quotidienne</option>
                          <option value="weekly">Hebdomadaire</option>
                          <option value="monthly">Mensuelle</option>
                          <option value="quarterly">Trimestrielle</option>
                          <option value="yearly">Annuelle</option>
                        </select>
                        <p className="text-xs text-blue-600 mt-1">
                          Définit à quelle fréquence la tâche doit se répéter.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Date de fin (optionnelle)
                        </label>
                        <input
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
                          className="w-full p-2 border rounded-md text-sm"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Si définie, la tâche ne sera plus recréée après cette
                          date. Si non définie, la tâche se répétera
                          indéfiniment.
                        </p>
                      </div>
                      {(editedTask.period === "quarterly" ||
                        editedTask.period === "yearly") && (
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              id="reminder-notification"
                              checked={!!editedTask.recurrenceReminderDate}
                              onChange={(e) => {
                                if (
                                  e.target.checked &&
                                  editedTask.realizationDate
                                ) {
                                  // Calculer date 10 jours avant réalisation
                                  const reminderDate = new Date(
                                    editedTask.realizationDate instanceof Date
                                      ? editedTask.realizationDate
                                      : new Date(editedTask.realizationDate)
                                  );
                                  reminderDate.setDate(
                                    reminderDate.getDate() - 10
                                  );
                                  setEditedTask({
                                    ...editedTask,
                                    recurrenceReminderDate: reminderDate,
                                  });
                                } else {
                                  setEditedTask({
                                    ...editedTask,
                                    recurrenceReminderDate: null,
                                  });
                                }
                              }}
                              className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="ml-2">
                              <label
                                htmlFor="reminder-notification"
                                className="text-sm font-medium"
                              >
                                Activer la notification anticipée
                              </label>
                              <p className="text-xs text-blue-600">
                                Envoi d&apos;une notification 10 jours avant
                                l&apos;échéance (recommandé pour les tâches peu
                                fréquentes)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Description */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h2 className="text-lg font-medium mb-3 flex items-center gap-1.5">
                  Description
                </h2>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                    placeholder="Ajouter une description..."
                  />
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {task.description || (
                      <span className="text-gray-400 italic">
                        Aucune description
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Bloc affichage récurrence (après la description) */}
              {task.recurring && (
                <div className="bg-white rounded-lg border shadow-sm p-4 mt-4">
                  <h2 className="text-lg font-medium mb-3 flex items-center gap-1.5">
                    <RefreshCcw className="h-5 w-5 text-blue-500" />
                    Récurrence
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">
                          Type de récurrence:
                        </span>
                        <span className="text-sm font-medium">
                          {task.period === "daily" && "Quotidienne"}
                          {task.period === "weekly" && "Hebdomadaire"}
                          {task.period === "monthly" && "Mensuelle"}
                          {task.period === "quarterly" && "Trimestrielle"}
                          {task.period === "yearly" && "Annuelle"}
                        </span>
                      </div>
                      {task.realizationDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">
                            Prochaine échéance:
                          </span>
                          <span className="text-sm font-medium">
                            {formatDate(task.realizationDate)}
                          </span>
                        </div>
                      )}
                      {task.endDate ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">
                            Date de fin de récurrence:
                          </span>
                          <span className="text-sm font-medium">
                            {formatDate(task.endDate)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">
                            Date de fin de récurrence:
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            Non définie (répétition sans fin)
                          </span>
                        </div>
                      )}
                      {(task.period === "quarterly" ||
                        task.period === "yearly") && (
                        <>
                          {task.recurrenceReminderDate ? (
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">
                                Date de notification anticipée:
                              </span>
                              <span className="text-sm font-medium text-blue-600">
                                {formatDate(task.recurrenceReminderDate)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">
                                Notification anticipée:
                              </span>
                              <span className="text-sm font-medium text-gray-500">
                                Non activée
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Explication du fonctionnement des tâches récurrentes */}
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span>
                        Cette tâche se répète automatiquement. Une fois
                        terminée, une nouvelle instance sera créée pour la
                        prochaine échéance.
                      </span>
                    </p>
                    {task.status === "completed" && (
                      <p className="mt-2 text-blue-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          Lorsque vous marquez cette tâche comme terminée, une
                          nouvelle instance sera automatiquement créée pour la
                          prochaine période.
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* Execution comment (if exists) */}
              {(task.executantComment || isEditing) && (
                <div className="bg-white rounded-lg border shadow-sm p-4">
                  <h2 className="text-lg font-medium mb-3">
                    Commentaire d&apos;exécution
                  </h2>
                  {isEditing ? (
                    <textarea
                      value={editedTask.executantComment || ""}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          executantComment: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                      placeholder="Commentaire sur l'exécution..."
                    />
                  ) : (
                    <div className="text-sm text-gray-700 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded-r-md whitespace-pre-wrap">
                      {task.executantComment}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata sidebar on desktop / conditional tab content on mobile */}
          {(activeTab === "details" || !isMobile) && (
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h3 className="font-medium text-gray-500 text-sm mb-4">
                  DÉTAILS
                </h3>

                <div className="space-y-4">
                  {/* Due date */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Date d&apos;échéance
                      </div>
                      {isEditing ? (
                        <input
                          type="date"
                          value={
                            editedTask.realizationDate
                              ? new Date(
                                  typeof editedTask.realizationDate ===
                                    "string" ||
                                  editedTask.realizationDate instanceof Date
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
                          className="w-full p-1 border rounded text-sm"
                        />
                      ) : (
                        <div className="text-sm font-medium">
                          {formatDate(task.realizationDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="flex items-start gap-2">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Assigné à
                      </div>
                      {isEditing ? (
                        <select
                          value={editedTask.assignedToId || ""}
                          onChange={(e) =>
                            setEditedTask({
                              ...editedTask,
                              assignedToId: e.target.value || null,
                            })
                          }
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value="">Non assigné</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm font-medium">
                          {task.assignedTo?.name || "Non assigné"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created/Updated dates */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Créée le: {formatDate(task.createdAt)}</span>
                      <span>Modifiée le: {formatDate(task.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents tab content - conditionally visible based on active tab */}
          {(activeTab === "documents" || !isMobile) && (
            <div className={`${isMobile ? "" : "md:col-span-3"} space-y-6`}>
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-1.5">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                  Documents
                </h2>
                <DocumentsList taskId={task.id} onDocumentsChange={() => {}} />
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Ajouter un document
                  </h3>
                  <DocumentUpload taskId={task.id} onUploadSuccess={() => {}} />
                </div>
              </div>
            </div>
          )}

          {/* Comments tab content - conditionally visible based on active tab */}
          {(activeTab === "comments" || !isMobile) && (
            <div className={`${isMobile ? "" : "md:col-span-3"} space-y-6`}>
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <TaskComments taskId={task.id} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
