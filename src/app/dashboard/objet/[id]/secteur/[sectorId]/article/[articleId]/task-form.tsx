"use client";

import { useState, useRef } from "react";
import {
  Calendar,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
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

export default function TaskFormWithDocuments({
  task,
  users,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(task?.recurring || false);
  const [formError, setFormError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultColor = "var(--primary)"; // Utilisation de la variable CSS

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

    if (name === "recurring") {
      setIsRecurring(checked);
    }
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
    // Vérifier le type de fichier
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

      // Vérifier la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
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

      // Construire l'objet de tâche complet
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

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto bg-[color:var(--card)] rounded-lg overflow-hidden shadow-lg border border-[color:var(--border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center bg-[color:var(--muted)] px-3 sm:px-6 py-3 sm:py-4 border-b border-[color:var(--border)]">
        <h2 className="text-base sm:text-xl font-semibold text-[color:var(--foreground)]">
          {task?.id ? "Modifier la tâche" : "Nouvelle tâche"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-8rem)]"
      >
        {formError && (
          <div className="mb-4 flex items-center gap-2 p-2 sm:p-3 bg-[color:var(--destructive-background)] border border-[color:var(--destructive-border)] rounded-lg text-[color:var(--destructive-foreground)] text-xs sm:text-sm">
            <AlertCircle size={14} className="sm:w-4 sm:h-4" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
            >
              Nom de la tâche *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Saisir le nom de la tâche"
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Description détaillée (optionnelle)"
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="pending">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="taskType"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Type de tâche
              </label>
              <input
                type="text"
                id="taskType"
                name="taskType"
                value={formData.taskType || ""}
                onChange={handleChange}
                placeholder="Ex: Maintenance, Nettoyage..."
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <label
                htmlFor="realizationDate"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Date de réalisation prévue
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="realizationDate"
                  name="realizationDate"
                  value={
                    formData.realizationDate
                      ? new Date(formData.realizationDate as unknown as string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                />
                <Calendar
                  size={14}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] pointer-events-none sm:w-4 sm:h-4"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="assignedToId"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Attribuer à
              </label>
              <select
                id="assignedToId"
                name="assignedToId"
                value={formData.assignedToId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 items-end">
            <div>
              <label
                htmlFor="color"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Couleur
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color || defaultColor}
                  onChange={handleColorChange}
                  className="w-10 h-10 sm:w-12 sm:h-12 p-1 border-0 rounded-md cursor-pointer"
                />
                <div
                  className="w-10 h-6 sm:w-12 sm:h-8 rounded border border-[color:var(--border)]"
                  style={{ backgroundColor: formData.color || defaultColor }}
                />
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center h-10 sm:h-12">
                <input
                  type="checkbox"
                  id="recurring"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-[color:var(--primary)] rounded focus:ring-[color:var(--ring)]"
                />
                <label
                  htmlFor="recurring"
                  className="ml-2 block text-xs sm:text-sm font-medium text-[color:var(--foreground)]"
                >
                  Tâche récurrente
                </label>
              </div>
            </div>
          </div>

          {isRecurring && (
            <div className="p-3 sm:p-5 bg-[color:var(--info-background)] rounded-lg border border-[color:var(--info-border)] space-y-3 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <div>
                  <label
                    htmlFor="period"
                    className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
                  >
                    Périodicité
                  </label>
                  <select
                    id="period"
                    name="period"
                    value={formData.period || "weekly"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                  >
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
                  >
                    Date de fin (optionnelle)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={
                        formData.endDate
                          ? new Date(formData.endDate as unknown as string)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                    />
                    <Calendar
                      size={14}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] pointer-events-none sm:w-4 sm:h-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {task?.id && (
            <div>
              <label
                htmlFor="executantComment"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Commentaire d&apos;exécution
              </label>
              <textarea
                id="executantComment"
                name="executantComment"
                value={formData.executantComment || ""}
                onChange={handleChange}
                placeholder="Commentaires sur l'exécution de la tâche"
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                rows={2}
              />
            </div>
          )}

          {/* Section pour l'upload de documents */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]">
              Documents
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
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

              <div className="flex flex-col items-center justify-center py-2 sm:py-4">
                <Paperclip className="h-8 w-8 sm:h-10 sm:w-10 text-[color:var(--muted-foreground)] mb-2" />
                <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] mb-2">
                  Glissez-déposez des fichiers ici, ou
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Sélectionnez des fichiers
                </button>
                <p className="text-[10px] sm:text-xs text-[color:var(--muted-foreground)] mt-2">
                  PDF, JPG, PNG, GIF (max. 10MB)
                </p>
              </div>
            </div>

            {/* Liste des fichiers à uploader */}
            {documents.length > 0 && (
              <div className="mt-3 sm:mt-4 space-y-2">
                <h4 className="text-xs sm:text-sm font-medium">
                  Fichiers à télécharger:
                </h4>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto pr-2">
                  {documents.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-[color:var(--background)] border rounded mb-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon
                            size={14}
                            className="text-blue-500 sm:w-4 sm:h-4"
                          />
                        ) : (
                          <FileText
                            size={14}
                            className="text-red-500 sm:w-4 sm:h-4"
                          />
                        )}
                        <span className="text-xs sm:text-sm truncate max-w-[180px] sm:max-w-[250px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 pt-4 border-t border-[color:var(--border)]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 sm:px-4 sm:py-2.5 border border-[color:var(--border)] rounded-lg text-xs sm:text-sm font-medium hover:bg-[color:var(--muted)] transition-colors text-[color:var(--foreground)]"
              disabled={isLoading}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[color:var(--primary)] hover:bg-opacity-90 text-[color:var(--primary-foreground)] rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading
                ? task?.id
                  ? "Mise à jour..."
                  : "Création..."
                : task?.id
                  ? "Mettre à jour"
                  : "Créer la tâche"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
