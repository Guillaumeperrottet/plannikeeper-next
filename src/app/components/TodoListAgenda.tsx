"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Printer,
  GripHorizontal,
  CalendarIcon,
  ListIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CalendarView from "./CalendarView";
import { LoadingIndicator } from "@/app/components/LoadingIndicator";

type Task = {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  realizationDate: Date | null; // Changed from string to Date
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
  recurrenceReminderDate: Date | null; // Added missing property
  assignedToId: string | null; // Added missing property
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
  assignedTo: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

// Raw task type from API before date conversion
type RawTask = Omit<
  Task,
  | "realizationDate"
  | "recurrenceReminderDate"
  | "endDate"
  | "createdAt"
  | "updatedAt"
> & {
  realizationDate: string | null;
  recurrenceReminderDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type AppObject = {
  id: string;
  nom: string;
};

// Enum pour les modes d'affichage
enum ViewMode {
  LIST = "list",
  CALENDAR = "calendar",
}

export default function TodoListAgenda() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [agendaHeight, setAgendaHeight] = useState<number>(48); // Hauteur en px
  const [startY, setStartY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<AppObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [maxHeight, setMaxHeight] = useState<number>(600); // valeur par défaut
  const [isNavigating, setIsNavigating] = useState(false);
  const agendaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Constantes pour les limites de hauteur
  const MIN_HEIGHT = 48; // Hauteur minimale (fermé)
  const EXPANDED_THRESHOLD = 100; // Seuil à partir duquel on considère l'agenda comme développé

  // Calculer MAX_HEIGHT côté client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setMaxHeight(window.innerHeight * 0.8);
    }
  }, []);

  // Charger la préférence de vue depuis localStorage au chargement
  useEffect(() => {
    const savedViewMode = localStorage.getItem("plannikeeper-view-mode");
    if (
      savedViewMode &&
      Object.values(ViewMode).includes(savedViewMode as ViewMode)
    ) {
      setViewMode(savedViewMode as ViewMode);
    }
  }, []);

  // Sauvegarder la préférence de vue dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem("plannikeeper-view-mode", viewMode);
  }, [viewMode]);

  // Récupération des objets
  useEffect(() => {
    const fetchObjects = async (): Promise<void> => {
      try {
        const response = await fetch("/api/objet");
        if (response.ok) {
          const data: AppObject[] = await response.json();
          setObjects(data);
          if (data.length > 0) {
            setSelectedObjectId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des objets :", error);
      }
    };
    fetchObjects();
  }, []);

  // Récupération des tâches quand l'objet sélectionné change
  useEffect(() => {
    const fetchTasks = async (): Promise<void> => {
      if (!selectedObjectId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tasks/object/${selectedObjectId}`);
        if (response.ok) {
          const data = await response.json();
          // Convert string dates to Date objects and add missing properties
          const tasksWithDateObjects: Task[] = data.map((task: RawTask) => ({
            ...task,
            realizationDate: task.realizationDate
              ? new Date(task.realizationDate)
              : null,
            recurrenceReminderDate: task.recurrenceReminderDate
              ? new Date(task.recurrenceReminderDate)
              : null,
            endDate: task.endDate ? new Date(task.endDate) : null,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            assignedToId: task.assignedToId || null,
          }));
          setTasks(tasksWithDateObjects);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tâches :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [selectedObjectId]);

  // Gestion du drag pour régler la hauteur
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent): void => {
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setIsDragging(true);
  };

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent): void => {
      if (!isDragging) return;

      const clientY =
        "touches" in e
          ? (e as TouchEvent).touches[0].clientY
          : (e as MouseEvent).clientY;
      const deltaY = startY - clientY;

      // Calculer la nouvelle hauteur en fonction du mouvement
      let newHeight = agendaHeight + deltaY;

      // Appliquer les limites de hauteur
      newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight));

      setAgendaHeight(newHeight);
      setIsExpanded(newHeight > EXPANDED_THRESHOLD);
      setStartY(clientY);
    },
    [
      isDragging,
      startY,
      agendaHeight,
      MIN_HEIGHT,
      maxHeight,
      EXPANDED_THRESHOLD,
    ]
  );

  const handleDragEnd = useCallback((): void => {
    setIsDragging(false);

    // Snap à la hauteur minimale si on est proche
    if (agendaHeight < 70) {
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);
    }
  }, [agendaHeight, MIN_HEIGHT]);

  useEffect(() => {
    // Ajouter les écouteurs d'événements pour le drag
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      // Nettoyer les écouteurs
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Le contrôle d'ouverture/fermeture est géré par toggleExpanded
  // Formatage de date
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  // Regroupement des tâches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));

  const thisWeekTasks: Task[] = [];
  const upcomingTasks: Task[] = [];

  tasks.forEach((task) => {
    if (task.status === "completed") return;
    if (!task.realizationDate) {
      thisWeekTasks.push(task);
      return;
    }
    const taskDate = new Date(task.realizationDate);
    taskDate.setHours(0, 0, 0, 0);
    if (taskDate <= thisWeekEnd) thisWeekTasks.push(task);
    else upcomingTasks.push(task);
  });

  // Navigation vers la tâche
  const navigateToTask = async (task: Task) => {
    try {
      setIsNavigating(true);
      router.push(
        `/dashboard/objet/${task.article.sector.object.id}` +
          `/secteur/${task.article.sector.id}` +
          `/article/${task.article.id}`
      );
    } catch (error) {
      console.error("Erreur de navigation:", error);
      setIsNavigating(false);
    }
  };
  // Impression
  const handlePrint = () => {
    window.print();
  };

  // Toggle expand/collapse
  const toggleExpanded = () => {
    if (isExpanded) {
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);
    } else {
      setAgendaHeight(maxHeight);
      setIsExpanded(true);
    }
  };
  const toggleViewMode = () => {
    setViewMode(viewMode === ViewMode.LIST ? ViewMode.CALENDAR : ViewMode.LIST);
  };

  return (
    <div
      ref={agendaRef}
      className="fixed bottom-0 left-0 right-0 bg-[color:var(--background)] transition-height duration-200 shadow-lg print:shadow-none print:relative print:h-auto border-t border-[color:var(--border)]"
      style={{
        height: `${agendaHeight}px`,
        zIndex: 40,
        position: isNavigating ? "relative" : "fixed",
      }}
      data-todo-list-agenda
    >
      {/* Overlay de chargement */}
      {isNavigating && <LoadingIndicator message="Chargement de la tâche..." />}

      {/* Barre de titre avec poignée de drag */}
      <div className="flex justify-between items-center bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] p-3 relative border-b border-[color:var(--border)]">
        {/* Colonne gauche avec toggle de vue */}
        <div className="w-1/4 flex items-center">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1 hover:bg-[color:var(--muted)] transition-colors bg-[color:var(--background)]"
          >
            {viewMode === ViewMode.LIST ? (
              <>
                <ListIcon
                  size={14}
                  className="text-[color:var(--foreground)]"
                />
                <span className="text-sm text-[color:var(--foreground)]">
                  Liste
                </span>
              </>
            ) : (
              <>
                <CalendarIcon
                  size={14}
                  className="text-[color:var(--foreground)]"
                />
                <span className="text-sm text-[color:var(--foreground)]">
                  Calendrier
                </span>
              </>
            )}
          </button>
        </div>

        {/* Titre centré avec poignée de drag au-dessus */}
        <div className="flex-1 flex justify-center items-center relative">
          <div
            className="absolute -top-4 w-16 h-6 flex justify-center items-center cursor-grab z-10"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <GripHorizontal
              size={20}
              className="hidden sm:block text-[color:var(--muted-foreground)]"
            />
          </div>
          <h2 className="text-xl font-semibold hidden sm:block">
            Agenda todo list
          </h2>
        </div>

        {/* Colonne droite avec les contrôles */}
        <div className="flex items-center gap-2 w-1/4 justify-end">
          <select
            className="bg-[color:var(--background)] text-[color:var(--foreground)] px-3 py-1 rounded border border-[color:var(--border)] text-sm mr-2"
            value={selectedObjectId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelectedObjectId(e.target.value)
            }
          >
            {objects.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.nom}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="p-1 rounded hover:bg-[color:var(--accent)] print:hidden text-[color:var(--foreground)]"
            title="Imprimer"
          >
            <Printer size={20} />
          </button>
          <button
            onClick={toggleExpanded}
            className="print:hidden text-[color:var(--foreground)]"
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
      </div>

      {/* Contenu: Liste ou Calendrier selon le mode */}
      <div className="overflow-y-auto" style={{ height: `calc(100% - 48px)` }}>
        {isLoading ? (
          <div className="p-4 text-center text-[color:var(--muted-foreground)]">
            Chargement des tâches...
          </div>
        ) : viewMode === ViewMode.CALENDAR ? (
          <CalendarView
            tasks={tasks}
            navigateToTask={async (task) => {
              await navigateToTask(task);
              // Fermer l'agenda après la navigation
              setAgendaHeight(MIN_HEIGHT);
              setIsExpanded(false);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Cette semaine */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-[color:var(--foreground)]">
                Cette semaine
              </h3>
              {thisWeekTasks.length === 0 ? (
                <p className="text-[color:var(--muted-foreground)]">
                  Aucune tâche pour cette semaine.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {thisWeekTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-[color:var(--primary)] text-[color:var(--foreground)]"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-[color:var(--muted-foreground)] mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-[color:var(--muted-foreground)] ml-1">
                        - {task.article.sector.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* À venir */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-[color:var(--foreground)]">
                À venir
              </h3>
              {upcomingTasks.length === 0 ? (
                <p className="text-[color:var(--muted-foreground)]">
                  Aucune tâche à venir.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {upcomingTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-[color:var(--primary)] text-[color:var(--foreground)]"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-[color:var(--muted-foreground)] mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-[color:var(--muted-foreground)] ml-1">
                        - {task.article.sector.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
