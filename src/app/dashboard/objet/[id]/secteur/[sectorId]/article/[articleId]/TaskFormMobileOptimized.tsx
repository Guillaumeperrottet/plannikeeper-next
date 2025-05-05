"use client";

import { useState, useRef } from "react";
import {
  Calendar,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id?: string;
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
  assignedTo?: User | null;
  createdAt?: Date;
  updatedAt?: Date;
};

interface TaskFormProps {
  task?: Task;
  users: User[];
  articleId: string;
  onSave: (task: Task, documents?: File[]) => Promise<void>;
  onCancel: () => void;
}

// Tabs pour organiser les sections
type TabId = "essential" | "details" | "recurring" | "documents";

interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "essential", label: "Essentiel" },
  { id: "details", label: "Détails" },
  { id: "recurring", label: "Récurrence" },
  { id: "documents", label: "Documents" },
];

export default function TaskFormMobileOptimized({
  task,
  users,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("essential");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultColor = "var(--primary)";

  const [formData, setFormData] = useState<
    Omit<Task, "id" | "assignedTo" | "createdAt" | "updatedAt">
  >({
    name: task?.name || "",
    description: task?.description || "",
    executantComment: task?.executantComment || "",
    done: task?.done || false,
    realizationDate: task?.realizationDate || null,
    status: task?.status || "pending",
    taskType: task?.taskType || "",
    color: task?.color || defaultColor,
    recurring: task?.recurring || false,
    period: task?.period || "weekly",
    endDate: task?.endDate || null,
    recurrenceReminderDate: task?.recurrenceReminderDate || null,
    assignedToId: task?.assignedToId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  // Gestion des documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      addDocuments(newFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      addDocuments(newFiles);
    }
  };

  const addDocuments = (files: File[]) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    const filteredFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `Le type de fichier ${file.type} n'est pas pris en charge.`
        );
        return false;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB).`);
        return false;
      }

      return true;
    });

    if (filteredFiles.length > 0) {
      setDocuments((prev) => [...prev, ...filteredFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Le nom de la tâche est requis");
      return;
    }

    try {
      setIsLoading(true);

      const taskData: Task = {
        ...formData,
        id: task?.id,
        realizationDate: formData.realizationDate
          ? new Date(formData.realizationDate as unknown as string)
          : null,
        endDate:
          formData.recurring && formData.endDate
            ? new Date(formData.endDate as unknown as string)
            : null,
      };

      await onSave(taskData, documents.length > 0 ? documents : undefined);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setFormError("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  // (AccordionSection removed because it was unused)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[color:var(--background)]"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[color:var(--border)] bg-[color:var(--card)]">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full hover:bg-[color:var(--muted)]"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold truncate flex-1 mx-3">
          {task?.id ? "Modifier la tâche" : "Nouvelle tâche"}
        </h2>
        <button
          type="submit"
          form="task-form"
          disabled={isLoading}
          className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg disabled:opacity-50 font-medium"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : task?.id ? (
            "Modifier"
          ) : (
            "Créer"
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[color:var(--border)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "text-[color:var(--primary)] border-b-2 border-[color:var(--primary)]"
                : "text-[color:var(--muted-foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form
        id="task-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto"
      >
        {formError && (
          <div className="m-3 flex items-center gap-2 p-3 bg-[color:var(--destructive-background)] border border-[color:var(--destructive-border)] rounded-lg text-[color:var(--destructive-foreground)] text-sm">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {/* Essential Tab */}
        {activeTab === "essential" && (
          <div className="p-3 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom de la tâche *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Titre de la tâche"
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="realizationDate"
                  value={
                    formData.realizationDate
                      ? new Date(formData.realizationDate as unknown as string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                />
                <Calendar
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
              >
                <option value="pending">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Assigné à
              </label>
              <select
                name="assignedToId"
                value={formData.assignedToId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
              >
                <option value="">Non assignée</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="p-3 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Détails de la tâche..."
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type de tâche
              </label>
              <input
                type="text"
                name="taskType"
                value={formData.taskType || ""}
                onChange={handleChange}
                placeholder="Ex: Maintenance, Nettoyage..."
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Couleur</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={formData.color || defaultColor}
                  onChange={handleColorChange}
                  className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-[color:var(--border)]"
                  style={{ backgroundColor: formData.color || defaultColor }}
                />
              </div>
            </div>

            {task?.id && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Commentaire d&apos;exécution
                </label>
                <textarea
                  name="executantComment"
                  value={formData.executantComment || ""}
                  onChange={handleChange}
                  placeholder="Commentaires sur l'exécution..."
                  className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                  rows={2}
                />
              </div>
            )}
          </div>
        )}

        {/* Recurring Tab */}
        {activeTab === "recurring" && (
          <div className="p-3 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="recurring"
                id="recurring"
                checked={formData.recurring}
                onChange={handleCheckboxChange}
                className="w-5 h-5 text-[color:var(--primary)] rounded focus:ring-[color:var(--ring)]"
              />
              <label htmlFor="recurring" className="ml-3 text-sm font-medium">
                Tâche récurrente
              </label>
            </div>

            {formData.recurring && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Périodicité
                  </label>
                  <select
                    name="period"
                    value={formData.period || "weekly"}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                  >
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={
                      formData.endDate
                        ? new Date(formData.endDate as unknown as string)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="p-3 space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50 bg-opacity-30"
                  : "border-[color:var(--border)]"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,image/*"
              />

              <div className="flex flex-col items-center justify-center py-4">
                <Paperclip className="h-8 w-8 text-[color:var(--muted-foreground)] mb-2" />
                <p className="text-sm text-[color:var(--muted-foreground)] mb-2">
                  Glissez-déposez des fichiers ici, ou
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Sélectionnez des fichiers
                </button>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-2">
                  PDF, JPG, PNG, GIF (max. 10MB)
                </p>
              </div>
            </div>

            {/* Liste des fichiers ajoutés */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fichiers à télécharger:</h4>
                <div className="space-y-2">
                  {documents.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-[color:var(--muted)] rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon size={16} className="text-blue-500" />
                        ) : (
                          <FileText size={16} className="text-red-500" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </motion.div>
  );
}
