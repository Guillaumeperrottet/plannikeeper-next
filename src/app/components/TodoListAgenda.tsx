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

type Task = {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  realizationDate: string | null;
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
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
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
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
  const agendaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Constantes pour les limites de hauteur
  const MIN_HEIGHT = 48; // Hauteur minimale (fermé)
  const MAX_HEIGHT = window.innerHeight * 0.8; // Hauteur maximale (80% de la fenêtre)
  const EXPANDED_THRESHOLD = 100; // Seuil à partir duquel on considère l'agenda comme développé

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

  // Récupération des tâches quand on change d'objet
  useEffect(() => {
    const fetchTasks = async (): Promise<void> => {
      if (!selectedObjectId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tasks/object/${selectedObjectId}`);
        if (response.ok) {
          const data: Task[] = await response.json();
          setTasks(data);
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
      newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));

      setAgendaHeight(newHeight);
      setIsExpanded(newHeight > EXPANDED_THRESHOLD);
      setStartY(clientY);
    },
    [
      isDragging,
      startY,
      agendaHeight,
      MIN_HEIGHT,
      MAX_HEIGHT,
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

  // Boutons pour ouvrir/fermer complètement
  const handleMinimize = (): void => {
    setAgendaHeight(MIN_HEIGHT);
    setIsExpanded(false);
  };

  const handleMaximize = (): void => {
    setAgendaHeight(MAX_HEIGHT);
    setIsExpanded(true);
  };

  const toggleExpanded = (): void => {
    if (isExpanded) {
      handleMinimize();
    } else {
      handleMaximize();
    }
  };

  // Formatage de date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  // Regroupement des tâches
  const groupTasksByPeriod = (): {
    thisWeekTasks: Task[];
    upcomingTasks: Task[];
  } => {
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

    return { thisWeekTasks, upcomingTasks };
  };

  const { thisWeekTasks, upcomingTasks } = groupTasksByPeriod();

  const handlePrint = (): void => {
    window.print();
  };

  const navigateToTask = (task: Task): void => {
    router.push(
      `/dashboard/objet/${task.article.sector.object.id}` +
        `/secteur/${task.article.sector.id}` +
        `/article/${task.article.id}`
    );
  };

  // Basculer entre les modes d'affichage
  const toggleViewMode = () => {
    setViewMode(viewMode === ViewMode.LIST ? ViewMode.CALENDAR : ViewMode.LIST);
  };

  return (
    <div
      ref={agendaRef}
      className="fixed bottom-0 left-0 right-0 bg-background transition-height duration-200 shadow-lg print:shadow-none print:relative print:h-auto border-t border-border"
      style={{
        height: `${agendaHeight}px`,
        zIndex: 40,
      }}
      data-todo-list-agenda
    >
      {/* Barre de titre avec poignée de drag */}
      <div className="flex justify-between items-center bg-[#F2E7D8] text-card-foreground p-3 relative border-b border-border">
        {/* Colonne gauche avec toggle de vue */}
        <div className="w-1/4 flex items-center">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1 hover:bg-[color:var(--muted)] transition-colors"
          >
            {viewMode === ViewMode.LIST ? (
              <>
                <ListIcon size={14} />
                <span className="text-sm">Liste</span>
              </>
            ) : (
              <>
                <CalendarIcon size={14} />
                <span className="text-sm">Calendrier</span>
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
            <GripHorizontal size={20} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Agenda todo list</h2>
        </div>

        {/* Colonne droite avec les contrôles */}
        <div className="flex items-center gap-2 w-1/4 justify-end">
          <select
            className="bg-background text-foreground px-3 py-1 rounded border border-border text-sm mr-2"
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
            className="p-1 rounded hover:bg-accent print:hidden"
            title="Imprimer"
          >
            <Printer size={20} />
          </button>
          <button
            onClick={toggleExpanded}
            className="print:hidden"
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
      </div>

      {/* Contenu: Liste ou Calendrier selon le mode */}
      <div className="overflow-y-auto" style={{ height: `calc(100% - 48px)` }}>
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Chargement des tâches...
          </div>
        ) : viewMode === ViewMode.CALENDAR ? (
          <CalendarView tasks={tasks} navigateToTask={navigateToTask} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Cette semaine */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Cette semaine</h3>
              {thisWeekTasks.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucune tâche pour cette semaine.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {thisWeekTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-primary"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-muted-foreground mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        - {task.article.sector.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* À venir */}
            <div>
              <h3 className="text-lg font-semibold mb-2">À venir</h3>
              {upcomingTasks.length === 0 ? (
                <p className="text-muted-foreground">Aucune tâche à venir.</p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {upcomingTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-primary"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-muted-foreground mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-muted-foreground ml-1">
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
