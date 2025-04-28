"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
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
  GripHorizontal,
  Printer,
  ViewIcon,
  LayoutList,
  CalendarDays,
} from "lucide-react";

// Importer le nouveau composant CalendarView
import CalendarView from "./CalendarView";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
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

type AppObject = {
  id: string;
  nom: string;
};

// Types des modes d'affichage
type ViewMode = "list" | "calendar";

export default function TodoListAgenda() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [agendaHeight, setAgendaHeight] = useState<number>(48); // Hauteur en px
  const [startY, setStartY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<AppObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const agendaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // État pour le mode d'affichage (liste ou calendrier)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Constantes pour les limites de hauteur
  const MIN_HEIGHT = 48; // Hauteur minimale (fermé)
  const MAX_HEIGHT = window.innerHeight * 0.8; // Hauteur maximale (80% de la fenêtre)
  const EXPANDED_THRESHOLD = 100; // Seuil à partir duquel on considère l'agenda comme développé

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

  const handleDragMove = (e: MouseEvent | TouchEvent): void => {
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
  };

  const handleDragEnd = (): void => {
    setIsDragging(false);

    // Snap à la hauteur minimale si on est proche
    if (agendaHeight < 70) {
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);
    }
  };

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
  }, [isDragging, agendaHeight]);

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

  const navigateToTask = (taskId: string): void => {
    // Trouver la tâche correspondante
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    router.push(
      `/dashboard/objet/${task.article.sector.object.id}` +
        `/secteur/${task.article.sector.id}` +
        `/article/${task.article.id}`
    );
  };

  // Fonction pour basculer entre les modes d'affichage
  const toggleViewMode = (): void => {
    // Si on passe en mode calendrier, s'assurer que l'agenda est ouvert
    if (viewMode === "list") {
      setViewMode("calendar");
      if (agendaHeight < 300) {
        setAgendaHeight(400);
        setIsExpanded(true);
      }
    } else {
      setViewMode("list");
    }
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
        {/* Colonne gauche avec bouton de changement de vue */}
        <div className="w-1/4 flex items-center">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/80 text-sm font-medium"
            title={
              viewMode === "list"
                ? "Passer en mode calendrier"
                : "Passer en mode liste"
            }
          >
            {viewMode === "list" ? (
              <>
                <CalendarDays size={18} />
                <span className="hidden sm:inline">Calendrier</span>
              </>
            ) : (
              <>
                <LayoutList size={18} />
                <span className="hidden sm:inline">Liste</span>
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
          <h2 className="text-xl font-semibold">
            {viewMode === "list" ? "Agenda todo list" : "Vue calendrier"}
          </h2>
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

      {/* Contenu */}
      <div className="overflow-y-auto" style={{ height: `calc(100% - 48px)` }}>
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Chargement des tâches...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {viewMode === "list" ? (
                // Mode liste existant
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {/* Cette semaine */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Cette semaine
                    </h3>
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
                            onClick={() => navigateToTask(task.id)}
                          >
                            {task.realizationDate && (
                              <span className="text-sm text-muted-foreground mr-2">
                                {formatDate(
                                  task.realizationDate as unknown as string
                                )}{" "}
                                -
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
                      <p className="text-muted-foreground">
                        Aucune tâche à venir.
                      </p>
                    ) : (
                      <ul className="list-disc list-inside space-y-2">
                        {upcomingTasks.map((task) => (
                          <li
                            key={task.id}
                            className="cursor-pointer hover:text-primary"
                            onClick={() => navigateToTask(task.id)}
                          >
                            {task.realizationDate && (
                              <span className="text-sm text-muted-foreground mr-2">
                                {formatDate(
                                  task.realizationDate as unknown as string
                                )}{" "}
                                -
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
              ) : (
                // Nouveau mode calendrier
                <div className="p-4 h-full">
                  <CalendarView
                    tasks={tasks}
                    onTaskClick={navigateToTask}
                    objectId={selectedObjectId}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
