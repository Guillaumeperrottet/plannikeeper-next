"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Printer,
  CalendarIcon,
  ListIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CalendarView from "./CalendarView";
import { LoadingIndicator } from "@/app/components/LoadingIndicator";
import { motion, AnimatePresence, useSpring } from "framer-motion";

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
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // Animation spring pour une sensation plus naturelle
  const springHeight = useSpring(agendaHeight, {
    stiffness: 300,
    damping: 30,
  });

  const agendaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Constantes pour les limites de hauteur
  const MIN_HEIGHT = 48; // Hauteur minimale (fermé)
  const EXPANDED_THRESHOLD = 100; // Seuil à partir duquel on considère l'agenda comme développé
  const MOBILE_BOTTOM_OFFSET = 20; // Décalage vers le haut pour le mode mobile en PWA

  // Détection du mode mobile et PWA
  useEffect(() => {
    // Vérifier si nous sommes sur mobile
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setMaxHeight(window.innerHeight * 0.8);
    };

    // Vérifier si nous sommes en PWA
    const checkPWA = () => {
      const isPWAMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator &&
          (window.navigator as { standalone?: boolean }).standalone === true);
      setIsPWA(isPWAMode);
    };

    checkMobile();
    checkPWA();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Gérer le scroll de la page
  useEffect(() => {
    // Fonction pour gérer le scroll et ajuster l'agenda
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const isScrollDown = scrollTop > lastScrollTop;

      setLastScrollTop(scrollTop);
      // Si on scroll vers le bas et que l'agenda est affiché, on le réduit
      if (isScrollDown && isExpanded && !isDragging) {
        setAgendaHeight(MIN_HEIGHT);
        setIsExpanded(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop, isExpanded, isDragging]);

  // Appliquer des ajustements pour PWA sur mobile
  useEffect(() => {
    if (isMobile && isPWA) {
      // Ajuster le padding-bottom pour éviter la barre de navigation mobile
      // et remonter l'agenda un peu plus haut
      document.body.style.paddingBottom = `${MIN_HEIGHT + MOBILE_BOTTOM_OFFSET}px`;
      if (agendaRef.current) {
        agendaRef.current.style.bottom = `${MOBILE_BOTTOM_OFFSET}px`;
      }
    } else {
      document.body.style.paddingBottom = "";
      if (agendaRef.current) {
        agendaRef.current.style.bottom = "0";
      }
    }

    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [isMobile, isPWA]);

  // Mettre à jour la hauteur animée avec le spring
  useEffect(() => {
    springHeight.set(agendaHeight);
  }, [agendaHeight, springHeight]);

  // Empêcher le scroll de la page quand on interagit avec l'agenda
  useEffect(() => {
    const preventBackgroundScroll = (e: TouchEvent | WheelEvent) => {
      // Si l'agenda est développé et que l'événement vient du contenu
      if (isExpanded && contentRef.current?.contains(e.target as Node)) {
        // Ne pas bloquer le scroll si on est déjà en haut ou en bas du contenu
        const content = contentRef.current;
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;

        // Pour les événements tactiles
        if (e.type === "touchmove") {
          const touch = (e as TouchEvent).touches[0];
          const currentY = touch.clientY;

          // Déterminer la direction du swipe
          const isSwipingUp = currentY < startY;

          // Si on swipe vers le haut et on est déjà en bas du contenu
          // Ou si on swipe vers le bas et on est déjà en haut du contenu
          if (
            (isSwipingUp && scrollTop + clientHeight >= scrollHeight - 5) ||
            (!isSwipingUp && scrollTop <= 5)
          ) {
            return; // Laisser le scroll de la page se faire
          }

          e.stopPropagation();
          // Ne pas preventDefault car cela bloquerait le scroll de l'agenda lui-même
        }
        // Pour la molette de la souris
        else if (e.type === "wheel") {
          const wheelEvent = e as WheelEvent;
          const isScrollingDown = wheelEvent.deltaY > 0;

          // Si on scroll vers le bas et on est déjà en bas du contenu
          // Ou si on scroll vers le haut et on est déjà en haut du contenu
          if (
            (isScrollingDown && scrollTop + clientHeight >= scrollHeight - 5) ||
            (!isScrollingDown && scrollTop <= 5)
          ) {
            return; // Laisser le scroll de la page se faire
          }

          e.stopPropagation();
        }
      }
    };

    // Ajouter les écouteurs sur le document
    document.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false,
    });
    document.addEventListener("wheel", preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventBackgroundScroll);
      document.removeEventListener("wheel", preventBackgroundScroll);
    };
  }, [isExpanded, startY]);

  // Gérer l'interaction du drag
  useEffect(() => {
    // Ajouter une classe au body quand dragging est actif
    if (isDragging) {
      document.body.classList.add("dragging-active");
    } else {
      document.body.classList.remove("dragging-active");
    }
    return () => {
      document.body.classList.remove("dragging-active");
    };
  }, [isDragging]);

  // Effet de snap pour une meilleure UX
  useEffect(() => {
    if (
      !isDragging &&
      agendaHeight > EXPANDED_THRESHOLD &&
      agendaHeight < maxHeight * 0.3
    ) {
      // Si le drag est lâché à une hauteur moyenne-basse, snap à une hauteur de 30%
      const targetHeight = maxHeight * 0.3;
      const animate = () => {
        setAgendaHeight((prev) => {
          const diff = targetHeight - prev;
          if (Math.abs(diff) < 1) return targetHeight;
          return prev + diff * 0.2; // Spring effect
        });
      };
      const timer = setInterval(animate, 16);
      return () => clearInterval(timer);
    }
  }, [isDragging, agendaHeight, maxHeight, EXPANDED_THRESHOLD]);

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

  // Optimisé pour mobile - gestion du drag avec retour tactile
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent): void => {
    e.preventDefault();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setIsDragging(true);

    // Ajout de retour haptique sur mobile
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10); // Légère vibration de 10ms
    }
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

      // Ajout d'un effet de "résistance" aux limites pour une sensation plus naturelle
      if (newHeight < MIN_HEIGHT) {
        newHeight = MIN_HEIGHT - (MIN_HEIGHT - newHeight) * 0.2;
      } else if (newHeight > maxHeight) {
        newHeight = maxHeight + (newHeight - maxHeight) * 0.2;
      }

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

    // Snap aux positions appropriées
    if (agendaHeight < 70) {
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);
    } else if (agendaHeight > maxHeight * 0.7) {
      // Snap au maximum si on est proche
      setAgendaHeight(maxHeight);
    }

    // Feedback haptique
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(5);
    }
  }, [agendaHeight, MIN_HEIGHT, maxHeight, isMobile]);

  useEffect(() => {
    // Ajouter les écouteurs d'événements pour le drag
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove, { passive: true });
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

  // Met à jour l'état de navigation lors de la navigation vers une tâche
  const navigateToTask = async (task: Task) => {
    try {
      setIsNavigating(true);

      // Retour haptique pour confirmer l'action
      if ("vibrate" in navigator && isMobile) {
        navigator.vibrate([15, 30, 15]);
      }

      // Naviguez sans attendre
      router.push(
        `/dashboard/objet/${task.article.sector.object.id}` +
          `/secteur/${task.article.sector.id}` +
          `/article/${task.article.id}`
      );

      // Fermez l'agenda
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);

      // Réinitialiser le chargement après un court délai
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
    } catch (error) {
      console.error("Erreur de navigation:", error);
      setIsNavigating(false);
    }
  };

  // Impression
  const handlePrint = () => {
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }
    window.print();
  };

  // Toggle expand/collapse avec animation et feedback tactile
  const toggleExpanded = () => {
    // Feedback haptique
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }

    if (isExpanded) {
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);
    } else {
      setAgendaHeight(maxHeight);
      setIsExpanded(true);
    }
  };

  const toggleViewMode = () => {
    // Feedback haptique
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }

    setViewMode(viewMode === ViewMode.LIST ? ViewMode.CALENDAR : ViewMode.LIST);
  };

  // Fermer complètement l'agenda (pour le bouton flottant mobile)
  const closeAgenda = () => {
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }
    setAgendaHeight(MIN_HEIGHT);
    setIsExpanded(false);
  };

  return (
    <>
      <motion.div
        ref={agendaRef}
        className="fixed bottom-0 left-0 right-0 bg-[color:var(--background)] shadow-lg print:shadow-none print:relative print:h-auto border-t border-[color:var(--border)] rounded-t-xl overflow-hidden z-40"
        style={{
          height: springHeight,
          position: isNavigating ? "relative" : "fixed",
          zIndex: 999, // Valeur plus élevée pour s'assurer que l'agenda est au-dessus de tous les éléments
        }}
        initial={false}
        animate={{
          height: agendaHeight,
          boxShadow: isExpanded
            ? "0 -4px 20px rgba(0,0,0,0.15)"
            : "0 -2px 10px rgba(0,0,0,0.1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        data-todo-list-agenda
      >
        {/* Overlay de chargement */}
        {isNavigating && (
          <LoadingIndicator message="Chargement de la tâche..." />
        )}

        {/* Barre de titre avec poignée de drag */}
        <div className="flex justify-between items-center bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] p-3 relative border-b border-[color:var(--border)]">
          {/* Handle de drag visible et plus large sur mobile */}
          <div
            className="absolute -top-1 left-0 right-0 h-8 flex justify-center items-start cursor-grab touch-manipulation"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="w-16 h-2 bg-[color:var(--border)] rounded-full mt-2 opacity-70 transform transition-all duration-200 drag-handle" />
          </div>

          {/* Colonne gauche avec toggle de vue */}
          <div className="w-1/4 flex items-center">
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1 hover:bg-[color:var(--muted)] active:scale-95 transition-all bg-[color:var(--background)]"
            >
              {viewMode === ViewMode.LIST ? (
                <>
                  <ListIcon
                    size={14}
                    className="text-[color:var(--foreground)]"
                  />
                  <span className="text-sm text-[color:var(--foreground)] hidden sm:block">
                    Liste
                  </span>
                </>
              ) : (
                <>
                  <CalendarIcon
                    size={14}
                    className="text-[color:var(--foreground)]"
                  />
                  <span className="text-sm text-[color:var(--foreground)] hidden sm:block">
                    Calendrier
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Titre centré */}
          <div className="flex-1 flex justify-center items-center">
            <h2 className="text-xl font-semibold hidden sm:block">
              Agenda todo list
            </h2>
            <h2 className="text-base font-semibold sm:hidden">Agenda</h2>
          </div>

          {/* Colonne droite avec les contrôles */}
          <div className="flex items-center gap-2 w-1/4 justify-end">
            <select
              className="bg-[color:var(--background)] text-[color:var(--foreground)] px-2 md:px-3 py-1 rounded border border-[color:var(--border)] text-sm transition-all active:scale-95"
              value={selectedObjectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedObjectId(e.target.value)
              }
              style={{
                WebkitAppearance: isMobile ? "none" : undefined,
                maxWidth: isMobile ? "100px" : undefined,
              }}
            >
              {objects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.nom}
                </option>
              ))}
            </select>
            <button
              onClick={handlePrint}
              className="p-1 rounded hover:bg-[color:var(--accent)] active:scale-95 transition-all print:hidden text-[color:var(--foreground)]"
              title="Imprimer"
              aria-label="Imprimer"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={toggleExpanded}
              className="print:hidden text-[color:var(--foreground)] active:scale-95 transition-all"
              title={isExpanded ? "Réduire" : "Agrandir"}
              aria-label={isExpanded ? "Réduire" : "Agrandir"}
            >
              {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </button>
          </div>
        </div>

        {/* Contenu: Liste ou Calendrier selon le mode */}
        <div
          ref={contentRef}
          className="overflow-y-auto agenda-content"
          style={{ height: `calc(100% - 48px)` }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-[color:var(--muted-foreground)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)] mx-auto mb-2"></div>
              <p>Chargement des tâches...</p>
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
                  <ul className="space-y-2">
                    {thisWeekTasks.map((task) => (
                      <motion.li
                        key={task.id}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer hover:bg-[color:var(--muted)] rounded-lg p-3 text-[color:var(--foreground)] active:bg-[color:var(--muted)]/80 transition-colors shadow-sm border border-[color:var(--border)]"
                        onClick={() => navigateToTask(task)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{task.name}</span>
                          <div className="flex text-xs text-[color:var(--muted-foreground)] mt-1">
                            {task.realizationDate && (
                              <span className="mr-2">
                                {formatDate(task.realizationDate)}
                              </span>
                            )}
                            <span>• {task.article.sector.name}</span>
                          </div>
                        </div>
                      </motion.li>
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
                  <ul className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <motion.li
                        key={task.id}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer hover:bg-[color:var(--muted)] rounded-lg p-3 text-[color:var(--foreground)] active:bg-[color:var(--muted)]/80 transition-colors shadow-sm border border-[color:var(--border)]"
                        onClick={() => navigateToTask(task)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{task.name}</span>
                          <div className="flex text-xs text-[color:var(--muted-foreground)] mt-1">
                            {task.realizationDate && (
                              <span className="mr-2">
                                {formatDate(task.realizationDate)}
                              </span>
                            )}
                            <span>• {task.article.sector.name}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Bouton flottant pour fermer rapidement sur mobile quand développé */}
      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] flex items-center justify-center shadow-lg z-50"
            onClick={closeAgenda}
            aria-label="Fermer l'agenda"
          >
            <X size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Styles spécifiques */}
      <style jsx global>{`
        body.dragging-active {
          overflow: hidden;
          touch-action: none;
        }

        .agenda-content {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 640px) {
          select {
            font-size: 0.8rem;
          }
        }

        /* Style spécifique pour PWA sur mobile */
        @media (display-mode: standalone) {
          body {
            overscroll-behavior: none;
          }

          .drag-handle {
            height: 6px;
            width: 40px;
            margin-top: 5px;
          }

          /* Améliorer la zone d'interaction tactile */
          [data-todo-list-agenda] button,
          [data-todo-list-agenda] select {
            min-height: 36px;
            margin: 2px;
          }

          /* Ajouter de la marge aux éléments de liste pour une meilleure sensation tactile */
          [data-todo-list-agenda] li {
            margin-bottom: 8px;
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
}
