"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  Calendar,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Loader2,
  Check,
  ChevronsUpDown,
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

  const defaultColor = "#d9840d";

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

  const [formData, setFormData] = useState<
    Omit<Task, "id" | "assignedTo" | "createdAt" | "updatedAt">
  >({
    name: task?.name || "",
    description: task?.description || "",
    executantComment: null, // Toujours null car on n'utilise plus ce champ
    done: task?.done || false,
    realizationDate: task?.realizationDate || null,
    status: task?.status || "pending",
    taskType: task?.taskType || "",
    color: task?.color || defaultColor,
    recurring: task?.recurring || false,
    period: task?.period || "weekly",
    endDate: task?.endDate || null,
    recurrenceReminderDate: task?.recurrenceReminderDate || null,
    assignedToId: getInitialAssignedTo(),
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

    if (!formData.assignedToId) {
      setFormError("L'assignation à un utilisateur est obligatoire");
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

  // Types prédéfinis de tâches
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
    const [customTaskTypes, setCustomTaskTypes] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fonction pour charger les types de tâches
    const loadCustomTaskTypes = useCallback(async () => {
      try {
        console.log("🔄 [Mobile] Chargement des types de tâches...");
        const response = await fetch("/api/tasks/types");
        if (response.ok) {
          const data = await response.json();
          console.log("✅ [Mobile] Types reçus:", data.types);
          setCustomTaskTypes(data.types || []);
        } else {
          console.error("❌ [Mobile] Erreur API:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("❌ [Mobile] Erreur lors du chargement des types de tâches:", error);
      }
    }, []);

    // Charger les types au montage
    useEffect(() => {
      loadCustomTaskTypes();
    }, [loadCustomTaskTypes]);

    // Recharger les types quand le dropdown s'ouvre
    useEffect(() => {
      if (open) {
        loadCustomTaskTypes();
      }
    }, [open, loadCustomTaskTypes]);

    // Combiner les types prédéfinis et personnalisés, en évitant les doublons
    const allTaskTypes = useMemo(() => {
      return [
        ...PREDEFINED_TASK_TYPES,
        ...customTaskTypes.filter(
          (type) => !PREDEFINED_TASK_TYPES.includes(type)
        ),
      ];
    }, [customTaskTypes]);

    // Détecter si la valeur actuelle est personnalisée
    useEffect(() => {
      if (value && !allTaskTypes.includes(value)) {
        setCustomMode(true);
        setSearchTerm(value);
      } else {
        setSearchTerm("");
      }
    }, [value, allTaskTypes]);

    // Activer l'input en mode personnalisé
    useEffect(() => {
      if (customMode && open && inputRef.current) {
        inputRef.current.focus();
      }
    }, [customMode, open]);

    // Filtrer les types selon la recherche
    const filteredTypes = searchTerm
      ? allTaskTypes.filter((type) =>
          type.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allTaskTypes;

    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-between w-full px-3 py-2 border border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--background)]"
          onClick={() => setOpen(!open)}
        >
          {!customMode ? (
            <span
              className={
                value
                  ? "text-[color:var(--foreground)]"
                  : "text-[color:var(--muted-foreground)]"
              }
            >
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
              className="w-full bg-transparent outline-none"
              placeholder="Saisir un type personnalisé"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <ChevronsUpDown size={16} className="opacity-50" />
        </div>

        {open && (
          <div className="absolute z-10 w-full mt-1 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg">
            <div className="max-h-60 overflow-y-auto">
              <div className="p-1">
                {/* Option pour basculer en mode personnalisé */}
                <div
                  className="flex items-center px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                  onClick={() => {
                    setCustomMode(true);
                    setOpen(false);
                    setTimeout(() => {
                      setOpen(true);
                      if (inputRef.current) inputRef.current.focus();
                    }, 10);
                  }}
                >
                  <span className="text-[color:var(--primary)]">
                    + Saisir un type personnalisé
                  </span>
                </div>

                {/* Types prédéfinis */}
                {customMode && searchTerm
                  ? filteredTypes.map((type) => (
                      <div
                        key={type}
                        className="flex items-center px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                        onClick={() => {
                          onChange(type);
                          setCustomMode(false);
                          setOpen(false);
                        }}
                      >
                        <span>{type}</span>
                      </div>
                    ))
                  : PREDEFINED_TASK_TYPES.map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                        onClick={() => {
                          onChange(type);
                          setOpen(false);
                        }}
                      >
                        <span>{type}</span>
                        {type === value && (
                          <Check
                            size={16}
                            className="text-[color:var(--primary)]"
                          />
                        )}
                      </div>
                    ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <div className="p-3 space-y-4 pb-20">
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
                Assigné à *
              </label>
              <select
                name="assignedToId"
                value={formData.assignedToId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
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
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="p-3 space-y-4 pb-20">
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
              <label
                htmlFor="taskType"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
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
          </div>
        )}

        {/* Recurring Tab */}
        {activeTab === "recurring" && (
          <div className="p-3 space-y-4 pb-20">
            {/* Section récurrence avec description explicative */}
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 mb-4">
                  Les tâches récurrentes sont automatiquement recréées selon la
                  périodicité définie, jusqu&apos;à la date de fin optionnelle.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Périodicité
                      <span className="ml-1 text-xs text-blue-600 font-normal">
                        À quelle fréquence cette tâche doit-elle se répéter ?
                      </span>
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
                      <span className="ml-1 text-xs text-blue-600 font-normal">
                        (Optionnelle) Quand arrêter de recréer cette tâche ?
                      </span>
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

                  {/* Section notifications pour les tâches trimestrielles et annuelles */}
                  {(formData.period === "quarterly" ||
                    formData.period === "yearly") && (
                    <div className="border-t border-blue-200 pt-4 mt-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="enableAdvanceNotification"
                          checked={!!formData.recurrenceReminderDate}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              recurrenceReminderDate:
                                e.target.checked && formData.realizationDate
                                  ? new Date(
                                      new Date(
                                        formData.realizationDate as unknown as string
                                      ).getTime() -
                                        10 * 24 * 60 * 60 * 1000
                                    )
                                  : null,
                            });
                          }}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-2">
                          <label
                            htmlFor="enableAdvanceNotification"
                            className="text-sm font-medium"
                          >
                            Notification anticipée
                          </label>
                          <p className="text-xs text-blue-700">
                            Recevoir une notification 10 jours avant
                            l&apos;échéance (Recommandé pour les tâches peu
                            fréquentes)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="p-3 space-y-4 pb-20">
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

            {/* Liste des fichiers ajoutés - version optimisée */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Fichiers à télécharger ({documents.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {documents.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-2 bg-[color:var(--muted)] rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {file.type.startsWith("image/") ? (
                          <div className="relative">
                            <ImageIcon size={20} className="text-blue-500" />
                          </div>
                        ) : (
                          <FileText size={20} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[color:var(--muted-foreground)]">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB •{" "}
                          {file.type.split("/")[1].toUpperCase()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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

      {/* Bouton flottant en bas pour mobile - visible seulement quand on scroll */}
      <div className="sticky bottom-0 left-0 right-0 bg-[color:var(--background)] border-t border-[color:var(--border)] p-3 shadow-lg">
        <button
          type="submit"
          form="task-form"
          disabled={isLoading}
          className="w-full py-3 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg disabled:opacity-50 font-medium text-base shadow-md hover:shadow-lg transition-shadow"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span>{task?.id ? "Modification..." : "Création..."}</span>
            </div>
          ) : task?.id ? (
            "Modifier la tâche"
          ) : (
            "Créer la tâche"
          )}
        </button>
      </div>
    </motion.div>
  );
}
