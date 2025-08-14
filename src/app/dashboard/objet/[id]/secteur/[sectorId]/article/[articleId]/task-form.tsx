"use client";

import { useState, useRef } from "react";
import {
  Calendar,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";

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
  onSave: (task: Task, documents?: File[]) => Promise<void>;
  onCancel: () => void;
}

const PREDEFINED_TASK_TYPES = ["Maintenance", "Entretien", "Réparation"];

// Composant pour le sélecteur de type de tâche
function TaskTypeSelect({
  value,
  onChange,
  className = "",
}: {
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Détecter si la valeur actuelle est personnalisée
  useEffect(() => {
    if (value && !PREDEFINED_TASK_TYPES.includes(value)) {
      setCustomMode(true);
      setSearchTerm(value);
    } else {
      setSearchTerm("");
    }
  }, [value]);

  // Activer l'input en mode personnalisé
  useEffect(() => {
    if (customMode && open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode, open]);

  // Filtrer les types prédéfinis selon la recherche
  const filteredTypes = searchTerm
    ? PREDEFINED_TASK_TYPES.filter((type) =>
        type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : PREDEFINED_TASK_TYPES;

  const selectClass = className.includes("mobile-select")
    ? "w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
    : "flex items-center justify-between w-full px-3 py-2 border border-input rounded-lg cursor-pointer bg-background";

  return (
    <div className={`relative ${className}`}>
      <div className={selectClass} onClick={() => setOpen(!open)}>
        {!customMode ? (
          <span className="text-sm text-gray-700">
            {value || "Sélectionner ou saisir un type"}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onChange(e.target.value);
            }}
            onBlur={() => setOpen(false)}
            placeholder="Saisir un type personnalisé"
            className="w-full bg-transparent outline-none text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>

      {open && !customMode && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher ou créer un type..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md"
              autoFocus
            />
          </div>

          <div className="py-1">
            {filteredTypes.map((type) => (
              <div
                key={type}
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                  setSearchTerm("");
                }}
              >
                {type}
                {value === type && <Check className="h-4 w-4" />}
              </div>
            ))}

            {searchTerm &&
              !filteredTypes.some(
                (type) => type.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <div
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-blue-600 font-medium"
                  onClick={() => {
                    onChange(searchTerm);
                    setCustomMode(true);
                    setOpen(false);
                  }}
                >
                  + Créer &ldquo;{searchTerm}&rdquo;
                </div>
              )}

            <div className="border-t border-gray-200 mt-1 pt-1">
              <div
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-gray-600"
                onClick={() => {
                  setCustomMode(true);
                  setOpen(false);
                }}
              >
                ✏️ Saisir un type personnalisé
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskForm({
  task,
  users,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bloquer le scroll du body en mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.style.overflow = "hidden";

      // Gérer la touche Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [onCancel]);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  // Auto-assign if only one user available
  const getInitialAssignedTo = () => {
    if (task?.assignedToId) {
      return task.assignedToId;
    }
    // If creating a new task and only one user, auto-assign
    if (!task && users.length === 1) {
      return users[0].id;
    }
    return "";
  };

  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    status: task?.status || "pending",
    taskType: task?.taskType || "",
    color: task?.color || "#d9840d",
    recurring: task?.recurring || false,
    period: task?.period || "weekly",
    endDate: task?.endDate || null,
    recurrenceReminderDate: task?.recurrenceReminderDate || null,
    assignedToId: getInitialAssignedTo(),
    realizationDate: task?.realizationDate || null,
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
      // Vérifier que le fichier a un nom valide
      if (!file.name || file.name.trim() === "" || file.name === "blob") {
        toast.error(
          `Le fichier n'a pas de nom valide. Veuillez renommer votre fichier.`
        );
        return false;
      }

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

    if (!formData.assignedToId) {
      setFormError("L'assignation à un utilisateur est obligatoire");
      return;
    }

    try {
      setIsLoading(true);

      const taskData: Task = {
        ...formData,
        id: task?.id,
        executantComment: null,
        done: false,
        realizationDate: formData.realizationDate
          ? new Date(formData.realizationDate as unknown as string)
          : null,
        endDate:
          formData.recurring && formData.endDate
            ? new Date(formData.endDate as unknown as string)
            : null,
      };

      await onSave(taskData, documents.length > 0 ? documents : undefined);

      // Si on arrive ici, la tâche a été sauvegardée avec succès
      // Le formulaire sera fermé par le parent (handleTaskSave)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setFormError("Une erreur est survenue lors de la sauvegarde");
      setIsLoading(false); // Important: remettre à false en cas d'erreur
    }
    // Note: on ne met pas finally ici car on veut que l'état loading reste true
    // jusqu'à ce que le parent ferme le formulaire après une sauvegarde réussie
  };

  return (
    <>
      {/* Desktop version */}
      <motion.div
        className="hidden md:block w-full max-w-3xl mx-auto bg-card rounded-lg overflow-hidden shadow-lg border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center bg-muted px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {task?.id ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {formError && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-destructive/15 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 text-foreground"
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
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2 text-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Description détaillée (optionnelle)"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Type de tâche
                </label>
                <TaskTypeSelect
                  value={formData.taskType}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, taskType: value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="realizationDate"
                  className="block text-sm font-medium mb-2 text-foreground"
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
                        ? new Date(formData.realizationDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-10 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="assignedToId"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Attribuer à *
                </label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurring task section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-2 focus:ring-ring"
                />
                <label
                  htmlFor="recurring"
                  className="text-sm font-medium text-foreground"
                >
                  Tâche récurrente
                </label>
              </div>

              {formData.recurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label
                      htmlFor="period"
                      className="block text-sm font-medium mb-2 text-foreground"
                    >
                      Période de récurrence
                    </label>
                    <select
                      id="period"
                      name="period"
                      value={formData.period || "weekly"}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
                      className="block text-sm font-medium mb-2 text-foreground"
                    >
                      Date de fin (optionnelle)
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={
                        formData.endDate
                          ? new Date(formData.endDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                    />
                  </div>

                  {(formData.period === "quarterly" ||
                    formData.period === "yearly") && (
                    <div className="col-span-full">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-3">
                          <strong>Rappel automatique :</strong> Pour les tâches{" "}
                          {formData.period === "quarterly"
                            ? "trimestrielles"
                            : "annuelles"}{" "}
                          avec une date de réalisation, un rappel sera créé
                          automatiquement 10 jours avant l&apos;échéance.
                        </p>
                        <div>
                          <label
                            htmlFor="recurrenceReminderDate"
                            className="block text-sm font-medium mb-2 text-blue-800"
                          >
                            Date de rappel personnalisée (optionnelle)
                          </label>
                          <input
                            type="date"
                            id="recurrenceReminderDate"
                            name="recurrenceReminderDate"
                            value={
                              formData.recurrenceReminderDate
                                ? new Date(formData.recurrenceReminderDate)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 text-sm rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-blue-900"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Laissez vide pour utiliser le rappel automatique (10
                            jours avant)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Documents section */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Documents
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border"
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
                  <Paperclip className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Glissez-déposez des fichiers ici, ou
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Sélectionnez des fichiers
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG, PNG, GIF (max. 10MB)
                  </p>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">
                    Fichiers à télécharger:
                  </h4>
                  <div className="max-h-40 overflow-y-auto pr-2">
                    {documents.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-background border border-border rounded mb-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon size={16} className="text-primary" />
                          ) : (
                            <FileText size={16} className="text-destructive" />
                          )}
                          <span className="text-sm truncate max-w-[250px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 border border-input rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground"
                disabled={isLoading}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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

      {/* Mobile version - full screen modal */}
      <div className="md:hidden fixed inset-0 bg-black/50 z-[9998]" />
      <motion.div
        className="md:hidden fixed inset-0 bg-background z-[9999] flex flex-col"
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ zIndex: 9999 }}
      >
        {/* Fixed header */}
        <div className="flex-shrink-0 bg-background border-b border-border px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                {task?.id ? "Modifier" : "Nouvelle tâche"}
              </h2>
            </div>
            <button
              form="mobile-task-form"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading
                ? task?.id
                  ? "Mise à jour..."
                  : "Création..."
                : task?.id
                  ? "Sauvegarder"
                  : "Créer"}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <form
            id="mobile-task-form"
            onSubmit={handleSubmit}
            className="p-4 pb-24"
          >
            {formError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 flex items-center gap-2 p-3 bg-destructive/15 border border-destructive/20 rounded-lg text-destructive text-sm"
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Nom de la tâche */}
              <div>
                <label
                  htmlFor="mobile-name"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Nom de la tâche *
                </label>
                <input
                  type="text"
                  id="mobile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Saisir le nom de la tâche"
                  className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="mobile-description"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="mobile-description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  placeholder="Description détaillée (optionnelle)"
                  className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Statut et Type en grille */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="mobile-status"
                    className="block text-sm font-medium mb-2 text-foreground"
                  >
                    Statut
                  </label>
                  <select
                    id="mobile-status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  >
                    <option value="pending">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mobile-taskType"
                    className="block text-sm font-medium mb-2 text-foreground"
                  >
                    Type de tâche
                  </label>
                  <TaskTypeSelect
                    value={formData.taskType}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, taskType: value }))
                    }
                    className="mobile-select"
                  />
                </div>
              </div>

              {/* Date de réalisation */}
              <div>
                <label
                  htmlFor="mobile-realizationDate"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Date de réalisation prévue
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="mobile-realizationDate"
                    name="realizationDate"
                    value={
                      formData.realizationDate
                        ? new Date(formData.realizationDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  />
                  <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {/* Assignation */}
              <div>
                <label
                  htmlFor="mobile-assignedToId"
                  className="block text-sm font-medium mb-2 text-foreground"
                >
                  Attribuer à *
                </label>
                <select
                  id="mobile-assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tâche récurrente */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="mobile-recurring"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-primary bg-background border-gray-300 rounded focus:ring-2 focus:ring-ring"
                  />
                  <label
                    htmlFor="mobile-recurring"
                    className="text-base font-medium text-foreground"
                  >
                    Tâche récurrente
                  </label>
                </div>

                {formData.recurring && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 ml-2"
                  >
                    <div>
                      <label
                        htmlFor="mobile-period"
                        className="block text-sm font-medium mb-2 text-foreground"
                      >
                        Période de récurrence
                      </label>
                      <select
                        id="mobile-period"
                        name="period"
                        value={formData.period || "weekly"}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
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
                        htmlFor="mobile-endDate"
                        className="block text-sm font-medium mb-2 text-foreground"
                      >
                        Date de fin (optionnelle)
                      </label>
                      <input
                        type="date"
                        id="mobile-endDate"
                        name="endDate"
                        value={
                          formData.endDate
                            ? new Date(formData.endDate)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-base rounded-xl border border-input focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                      />
                    </div>

                    {(formData.period === "quarterly" ||
                      formData.period === "yearly") && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 mb-3">
                          <strong>Rappel automatique :</strong> Pour les tâches{" "}
                          {formData.period === "quarterly"
                            ? "trimestrielles"
                            : "annuelles"}{" "}
                          avec une date de réalisation, un rappel sera créé
                          automatiquement 10 jours avant l&apos;échéance.
                        </p>
                        <div>
                          <label
                            htmlFor="mobile-recurrenceReminderDate"
                            className="block text-sm font-medium mb-2 text-blue-800"
                          >
                            Date de rappel personnalisée (optionnelle)
                          </label>
                          <input
                            type="date"
                            id="mobile-recurrenceReminderDate"
                            name="recurrenceReminderDate"
                            value={
                              formData.recurrenceReminderDate
                                ? new Date(formData.recurrenceReminderDate)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-base rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-blue-900"
                          />
                          <p className="text-xs text-blue-600 mt-2">
                            Laissez vide pour utiliser le rappel automatique (10
                            jours avant)
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Documents section - optimisée mobile */}
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  Documents
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-border"
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
                    <Paperclip className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-base text-muted-foreground mb-3">
                      Glissez-déposez des fichiers ici, ou
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 text-base text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors font-medium"
                    >
                      Sélectionnez des fichiers
                    </button>
                    <p className="text-sm text-muted-foreground mt-3">
                      PDF, JPG, PNG, GIF (max. 10MB)
                    </p>
                  </div>
                </div>

                {/* Liste des fichiers optimisée mobile */}
                {documents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-2"
                  >
                    <h4 className="text-sm font-medium">
                      Fichiers à télécharger :
                    </h4>
                    <div className="space-y-2">
                      {documents.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 bg-background border border-border rounded-xl"
                        >
                          <div className="flex items-center gap-3 truncate flex-1">
                            {file.type.startsWith("image/") ? (
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <ImageIcon size={16} className="text-primary" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                                <FileText
                                  size={16}
                                  className="text-destructive"
                                />
                              </div>
                            )}
                            <div className="truncate flex-1">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
