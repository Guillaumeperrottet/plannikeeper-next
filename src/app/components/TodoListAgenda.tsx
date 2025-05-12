"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  CalendarIcon,
  ListIcon,
  X,
  ChevronUp,
  Briefcase,
  ArrowUp,
  SearchIcon,
  ExternalLink,
  Filter,
} from "lucide-react";
import CalendarView from "./CalendarView";
import { useGlobalLoader } from "@/app/components/GlobalLoader";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { useRouter as useCustomRouter } from "@/lib/router-helper";

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

// Type pour représenter un article pour le filtrage
type ArticleOption = {
  id: string;
  title: string;
  sectorName: string;
};

// Enum pour les modes d'affichage
enum ViewMode {
  LIST = "list",
  CALENDAR = "calendar",
}

export default function TodoListAgenda() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [agendaHeight, setAgendaHeight] = useState<number>(48); // Hauteur en px
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<AppObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [maxHeight, setMaxHeight] = useState<number>(600); // valeur par défaut
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Nouveau state pour le filtre par article
  const [articleFilter, setArticleFilter] = useState<string>("all");
  // State pour stocker les articles disponibles pour le filtre
  const [availableArticles, setAvailableArticles] = useState<ArticleOption[]>(
    []
  );

  // Animation spring pour une sensation plus naturelle
  const springHeight = useSpring(agendaHeight, {
    stiffness: 300,
    damping: 30,
  });

  const agendaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const thisWeekRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);
  const customRouter = useCustomRouter();
  const { hideLoader } = useGlobalLoader();

  // Constantes pour les limites de hauteur
  const MIN_HEIGHT = 48; // Hauteur minimale (fermé)

  // Détection du mode mobile et PWA
  useEffect(() => {
    // Vérifier si nous sommes sur mobile
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);

      // Ajuster la hauteur maximale en fonction de la taille de l'écran
      // Pour les grands écrans on utilise 85% de la hauteur de la fenêtre
      // Pour les petits écrans on utilise 80% pour laisser de l'espace pour la navigation
      setMaxHeight(window.innerHeight * (isMobileView ? 0.8 : 0.85));
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

  // Après un changement d'état d'expansion, verrouiller brièvement les interactions
  // pour éviter les clics indésirables pendant l'animation
  useEffect(() => {
    if (isExpanded) {
      setInteractionLocked(true);
      // Afficher les contrôles après un court délai pour une transition fluide
      setTimeout(() => {
        setShowControls(true);
      }, 150);
      // Déverrouiller après un court délai pour permettre à l'animation de se stabiliser
      const timer = setTimeout(() => {
        setInteractionLocked(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Masquer les contrôles immédiatement pour l'animation de fermeture
      setShowControls(false);
      setShowFiltersPanel(false);
    }
  }, [isExpanded]);

  // Gérer le scroll de la page
  useEffect(() => {
    // Fonction pour gérer le scroll et ajuster l'agenda
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const isScrollDown = scrollTop > lastScrollTop;

      setLastScrollTop(scrollTop);
      // Si on scroll vers le bas et que l'agenda est affiché, on le réduit
      if (isScrollDown && isExpanded) {
        setAgendaHeight(MIN_HEIGHT);
        setIsExpanded(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop, isExpanded]);

  // Appliquer des ajustements pour PWA sur mobile
  useEffect(() => {
    if (isMobile && isPWA) {
      // Ne pas ajouter de padding-bottom supplémentaire au body
      document.body.style.paddingBottom = `${MIN_HEIGHT}px`;

      if (agendaRef.current) {
        // Positionner l'agenda directement contre le bas de l'écran
        agendaRef.current.style.bottom = "0";
        // Ajuster la hauteur pour tenir compte des safe areas
        agendaRef.current.style.paddingBottom =
          "env(safe-area-inset-bottom, 0px)";
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
  }, [isMobile, isPWA, MIN_HEIGHT]);

  // Mettre à jour la hauteur animée avec le spring
  useEffect(() => {
    springHeight.set(agendaHeight);
  }, [agendaHeight, springHeight]);

  // Empêcher le scroll de la page quand on interagit avec l'agenda en mode desktop uniquement
  useEffect(() => {
    if (isMobile) return; // Ne pas ajouter cette fonctionnalité sur mobile

    const preventBackgroundScroll = (e: TouchEvent | WheelEvent) => {
      if (isExpanded && contentRef.current?.contains(e.target as Node)) {
        const content = contentRef.current;
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;

        if (e.type === "wheel") {
          const wheelEvent = e as WheelEvent;
          const isScrollingDown = wheelEvent.deltaY > 0;

          if (
            (isScrollingDown && scrollTop + clientHeight >= scrollHeight - 5) ||
            (!isScrollingDown && scrollTop <= 5)
          ) {
            return;
          }

          e.stopPropagation();
        }
      }
    };

    document.addEventListener("wheel", preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", preventBackgroundScroll);
    };
  }, [isExpanded, isMobile]);

  // Bloquer les événements tactiles indésirables quand agenda ouvert sur mobile
  useEffect(() => {
    if (!isMobile || !isExpanded) return;

    // Fonction qui empêche tous les événements de toucher de se propager
    // au-delà de l'agenda quand il est ouvert
    const blockTouchEvents = (e: TouchEvent) => {
      if (agendaRef.current?.contains(e.target as Node)) {
        // Ne pas bloquer les événements dans l'agenda
        return;
      }

      // Bloquer les événements venant du reste de la page quand l'agenda est ouvert
      e.preventDefault();
      e.stopPropagation();
    };

    // Désactiver le scroll de la page quand l'agenda est ouvert
    const originalStyle = document.body.style.overflow;
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    }

    // Ajouter les événements tactiles
    document.addEventListener("touchstart", blockTouchEvents, {
      passive: false,
    });
    document.addEventListener("touchmove", blockTouchEvents, {
      passive: false,
    });
    document.addEventListener("touchend", blockTouchEvents, { passive: false });

    return () => {
      // Restaurer le scroll et supprimer les écouteurs
      document.body.style.overflow = originalStyle;
      document.removeEventListener("touchstart", blockTouchEvents);
      document.removeEventListener("touchmove", blockTouchEvents);
      document.removeEventListener("touchend", blockTouchEvents);
    };
  }, [isMobile, isExpanded]);

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

          // Extraire les articles des tâches pour le filtre
          const articlesMap = new Map<string, ArticleOption>();
          tasksWithDateObjects.forEach((task) => {
            if (!articlesMap.has(task.article.id)) {
              articlesMap.set(task.article.id, {
                id: task.article.id,
                title: task.article.title,
                sectorName: task.article.sector.name,
              });
            }
          });
          setAvailableArticles(Array.from(articlesMap.values()));
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des tâches :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [selectedObjectId]);

  // Met à jour l'état de navigation lors de la navigation vers une tâche
  const navigateToTask = async (task: Task): Promise<void> => {
    try {
      // Retour haptique pour confirmer l'action
      if ("vibrate" in navigator && isMobile) {
        navigator.vibrate([15, 30, 15]);
      }

      // Fermer l'agenda immédiatement pour une meilleure UX
      setAgendaHeight(MIN_HEIGHT);
      setIsExpanded(false);

      // Utiliser la fonction de navigation personnalisée avec gestion du chargement
      await customRouter.navigateWithLoading(
        `/dashboard/objet/${task.article.sector.object.id}` +
          `/secteur/${task.article.sector.id}` +
          `/article/${task.article.id}`,
        {
          loadingMessage: "Chargement de la tâche...",
          hapticFeedback: true,
          delay: 50, // Petit délai pour permettre la fermeture de l'agenda
        }
      );
    } catch (error) {
      console.error("Erreur de navigation:", error);
      hideLoader(); // S'assurer que le loader est caché en cas d'erreur
    }
  };

  // Toggle expand/collapse avec animation et feedback tactile
  const toggleExpanded = () => {
    // Ne rien faire si les interactions sont verrouillées
    if (interactionLocked) return;

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
  const closeAgenda = (e?: React.MouseEvent) => {
    // Empêcher la propagation de l'événement
    if (e) {
      e.stopPropagation();
    }

    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }
    setAgendaHeight(MIN_HEIGHT);
    setIsExpanded(false);
  };

  // Formatage de date
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  // Handler pour les clics à l'intérieur du contenu de l'agenda
  // qui ne devraient PAS fermer l'agenda
  const handleContentClick = (e: React.MouseEvent) => {
    // Empêcher la propagation de l'événement pour que le clic
    // ne soit pas capturé par handleBackgroundClick
    e.stopPropagation();
  };

  // Fonction pour déterminer si une tâche correspond aux filtres
  const taskMatchesFilters = (task: Task): boolean => {
    // Filtrer par texte de recherche
    const searchMatch =
      searchTerm === "" ||
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.article.sector.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrer par statut
    const statusMatch = statusFilter === "all" || task.status === statusFilter;

    // Filtrer par article
    const articleMatch =
      articleFilter === "all" || task.article.id === articleFilter;

    return searchMatch && statusMatch && articleMatch;
  };

  // Regroupement des tâches avec filtrage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));

  // Filtrer les tâches avec un pré-filtre pour masquer les tâches terminées et annulées par défaut
  const filteredTasks = tasks.filter((task) => {
    // Exclure par défaut les tâches terminées et annulées,
    // sauf si l'utilisateur a explicitement demandé à les voir
    if (
      (task.status === "completed" || task.status === "cancelled") &&
      statusFilter !== "completed" &&
      statusFilter !== "cancelled"
    ) {
      return false;
    }

    return taskMatchesFilters(task);
  });

  const thisWeekTasks: Task[] = [];
  const upcomingTasks: Task[] = [];

  filteredTasks.forEach((task) => {
    if (!task.realizationDate) {
      thisWeekTasks.push(task);
      return;
    }
    const taskDate = new Date(task.realizationDate);
    taskDate.setHours(0, 0, 0, 0);
    if (taskDate <= thisWeekEnd) thisWeekTasks.push(task);
    else upcomingTasks.push(task);
  });

  // Récupérer le nom de l'objet sélectionné
  const selectedObjectName =
    objects.find((obj) => obj.id === selectedObjectId)?.nom || "Objet";

  // Définir le contenu du titre en fonction de l'état d'expansion
  const titleContent =
    isMobile && !isExpanded ? (
      <>
        <span className="text-base font-semibold">Agenda</span>
        <span className="text-xs ml-2 text-muted-foreground">
          {`${thisWeekTasks.length + upcomingTasks.length} tâches`}
        </span>
      </>
    ) : (
      <>
        <h2 className="text-xl font-semibold hidden sm:block">
          Agenda todo list
        </h2>
        <h2 className="text-base font-semibold sm:hidden">Agenda</h2>
      </>
    );

  // Fonction pour scroller vers une section spécifique
  const scrollToSection = (section: "thisWeek" | "upcoming") => {
    if (section === "thisWeek" && thisWeekRef.current) {
      thisWeekRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "upcoming" && upcomingRef.current) {
      upcomingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[color:var(--warning-background)] text-[color:var(--warning-foreground)] border-[color:var(--warning-border)]";
      case "in_progress":
        return "bg-[color:var(--info-background)] text-[color:var(--info-foreground)] border-[color:var(--info-border)]";
      case "completed":
        return "bg-[color:var(--success-background)] text-[color:var(--success-foreground)] border-[color:var(--success-border)]";
      case "cancelled":
        return "bg-[color:var(--destructive-background)] text-[color:var(--destructive-foreground)] border-[color:var(--destructive-border)]";
      default:
        return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]";
    }
  };

  return (
    <>
      <motion.div
        ref={agendaRef}
        className={`fixed bottom-0 left-0 right-0 bg-[color:var(--background)] shadow-lg print:shadow-none print:relative print:h-auto border-t border-[color:var(--border)] rounded-t-xl overflow-hidden z-40 ${isExpanded ? "expanded touch-none" : ""}`}
        style={{
          height: springHeight,
          position: "fixed",
          zIndex: 999,
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
        {/* Barre de titre adaptative pour mobile/desktop */}
        <div
          className="flex justify-between items-center bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] relative border-b border-[color:var(--border)]"
          onClick={handleContentClick} // Empêcher la propagation
        >
          {/* Partie gauche : sur desktop = contrôles de vue, sur mobile = vide ou icône */}
          <div className="w-1/4 flex items-center">
            {!isMobile && (
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
            )}
            {isMobile && isExpanded && (
              <button
                onClick={closeAgenda}
                className="ml-2 p-2 rounded-full hover:bg-[color:var(--muted)]"
                aria-label="Fermer l'agenda"
              >
                <X size={20} className="text-[color:var(--foreground)]" />
              </button>
            )}
          </div>

          {/* Titre centré */}
          <div className="flex-1 flex justify-center items-center">
            {titleContent}
          </div>

          {/* Partie droite : sur desktop = sélecteur d'objet, sur mobile = icône d'expansion */}
          <div className="flex items-center gap-2 md:gap-4">
            {(!isMobile || (isMobile && showControls)) && (
              <select
                className="bg-[color:var(--background)] text-[color:var(--foreground)] px-2 md:px-3 py-1 rounded border border-[color:var(--border)] text-sm transition-all active:scale-95"
                value={selectedObjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedObjectId(e.target.value)
                }
                style={{
                  WebkitAppearance: isMobile ? "none" : undefined,
                  maxWidth: isMobile ? "140px" : undefined,
                }}
              >
                {objects.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.nom}
                  </option>
                ))}
              </select>
            )}
            {/* Bouton toggle expand/collapse - adaptative selon la plateforme */}
            {(!isMobile || (isMobile && !isExpanded)) && (
              <button
                onClick={toggleExpanded}
                className="print:hidden text-[color:var(--foreground)] active:scale-95 transition-all mr-2"
                title={isExpanded ? "Réduire" : "Agrandir"}
                aria-label={isExpanded ? "Réduire" : "Agrandir"}
              >
                {isExpanded ? (
                  <ChevronDown size={24} />
                ) : (
                  <ChevronUp size={24} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Barre des contrôles supplémentaires (uniquement affichée quand l'agenda est ouvert) */}
        <AnimatePresence>
          {isExpanded && showControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 px-4 py-2 bg-[color:var(--muted)] border-b border-[color:var(--border)]"
            >
              {/* Première ligne: Contrôles de vue (liste/calendrier) et bouton de filtre */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleViewMode}
                    className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm ${
                      viewMode === ViewMode.LIST
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "bg-[color:var(--background)] text-[color:var(--foreground)]"
                    }`}
                  >
                    <ListIcon size={14} />
                    <span>Liste</span>
                  </button>
                  <button
                    onClick={toggleViewMode}
                    className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm ${
                      viewMode === ViewMode.CALENDAR
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "bg-[color:var(--background)] text-[color:var(--foreground)]"
                    }`}
                  >
                    <CalendarIcon size={14} />
                    <span>Calendrier</span>
                  </button>

                  {/* Nouveau bouton pour afficher/masquer les filtres */}
                  {viewMode === ViewMode.LIST && (
                    <button
                      onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm ${
                        showFiltersPanel
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "bg-[color:var(--background)] text-[color:var(--foreground)]"
                      }`}
                    >
                      <Filter size={14} />
                      <span className="hidden sm:inline">Filtres</span>
                    </button>
                  )}
                </div>

                {/* Information sur l'objet sélectionné */}
                <div className="flex items-center text-sm text-[color:var(--muted-foreground)]">
                  <Briefcase size={14} className="mr-1" />
                  <span className="truncate max-w-[120px]">
                    {selectedObjectName}
                  </span>
                </div>
              </div>

              {/* Panneau de filtres conditionnel */}
              <AnimatePresence>
                {viewMode === ViewMode.LIST && showFiltersPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 mt-1"
                  >
                    {/* Barre de recherche */}
                    <div className="relative flex-1">
                      <SearchIcon
                        size={16}
                        className="absolute left-2 top-2.5 text-[color:var(--muted-foreground)]"
                      />
                      <input
                        type="text"
                        placeholder="Rechercher une tâche..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-1.5 pl-8 pr-3 text-sm rounded border border-[color:var(--border)] bg-[color:var(--background)]"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2 top-2.5 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Filtres : statut et article */}
                    <div className="flex justify-between gap-3">
                      {/* Filtre par statut */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-1/2 bg-[color:var(--background)] text-[color:var(--foreground)] px-3 py-1.5 rounded border border-[color:var(--border)] text-sm"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">A faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminées</option>
                        <option value="cancelled">Annulées</option>
                      </select>

                      {/* Filtre par article */}
                      <select
                        value={articleFilter}
                        onChange={(e) => setArticleFilter(e.target.value)}
                        className="w-1/2 bg-[color:var(--background)] text-[color:var(--foreground)] px-3 py-1.5 rounded border border-[color:var(--border)] text-sm"
                      >
                        <option value="all">Tous les articles</option>
                        {availableArticles.map((article) => (
                          <option key={article.id} value={article.id}>
                            {article.title} ({article.sectorName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation rapide en mode liste - toujours visible */}
              {viewMode === ViewMode.LIST && (
                <div className="flex justify-between mt-1">
                  <button
                    onClick={() => scrollToSection("thisWeek")}
                    className="text-sm text-[color:var(--primary)] hover:underline flex items-center"
                  >
                    Cette semaine ({thisWeekTasks.length})
                  </button>
                  <button
                    onClick={() => scrollToSection("upcoming")}
                    className="text-sm text-[color:var(--primary)] hover:underline flex items-center"
                  >
                    À venir ({upcomingTasks.length})
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenu: Liste ou Calendrier selon le mode - protégé contre les clics de fermeture */}
        <div
          ref={contentRef}
          className="overflow-y-auto agenda-content"
          style={{
            height: `calc(100% - ${isExpanded && showControls ? (viewMode === ViewMode.LIST ? "110px" : "96px") : "48px"})`,
          }}
          onClick={handleContentClick} // Empêcher la propagation
        >
          {isLoading ? (
            <div className="p-4 text-center text-[color:var(--muted-foreground)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--primary)] mx-auto mb-2"></div>
              <p>Chargement des tâches...</p>
            </div>
          ) : viewMode === ViewMode.CALENDAR ? (
            <CalendarView tasks={tasks} navigateToTask={navigateToTask} />
          ) : (
            <div
              className={`grid grid-cols-1 ${isMobile ? "" : "md:grid-cols-2"} gap-4 p-4`}
            >
              {/* Cette semaine */}
              <div ref={thisWeekRef}>
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--foreground)] sticky top-0 bg-[color:var(--background)] py-2 z-10">
                  Cette semaine
                </h3>
                {thisWeekTasks.length === 0 ? (
                  <p className="text-[color:var(--muted-foreground)] p-4 bg-[color:var(--muted)]/20 rounded-lg text-center">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    articleFilter !== "all"
                      ? "Aucune tâche ne correspond à vos critères de recherche."
                      : "Aucune tâche pour cette semaine."}
                  </p>
                ) : (
                  <ul className="space-y-2 pb-4">
                    {thisWeekTasks.map((task) => (
                      <motion.li
                        key={task.id}
                        whileTap={{ scale: 0.98 }}
                        className={`cursor-pointer hover:bg-[color:var(--muted)] rounded-lg p-3 text-[color:var(--foreground)] active:bg-[color:var(--muted)]/80 transition-colors shadow-sm border ${getStatusColor(task.status)}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher la propagation ici aussi
                          navigateToTask(task);
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{task.name}</span>
                            <span className="text-xs py-0.5 px-2 rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
                              {task.status === "pending"
                                ? "A faire"
                                : task.status === "in_progress"
                                  ? "En cours"
                                  : task.status === "completed"
                                    ? "Terminée"
                                    : task.status === "cancelled"
                                      ? "Annulée"
                                      : task.status}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-[color:var(--muted-foreground)] mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                              {task.realizationDate && (
                                <span className="bg-[color:var(--muted)]/40 py-0.5 px-1.5 rounded">
                                  {formatDate(task.realizationDate)}
                                </span>
                              )}
                              <span>• {task.article.sector.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {task.assignedTo && (
                                <span className="text-xs text-[color:var(--muted-foreground)]">
                                  {task.assignedTo.name}
                                </span>
                              )}

                              <ExternalLink
                                size={14}
                                className="text-[color:var(--muted-foreground)] ml-1"
                              />
                            </div>
                          </div>

                          {/* Titre de l'article */}
                          <div className="mt-1 pt-1 border-t border-[color:var(--border)]/30">
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                              Article: {task.article.title}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* À venir */}
              <div ref={upcomingRef}>
                <h3 className="text-lg font-semibold mb-2 text-[color:var(--foreground)] sticky top-0 bg-[color:var(--background)] py-2 z-10">
                  À venir
                </h3>
                {upcomingTasks.length === 0 ? (
                  <p className="text-[color:var(--muted-foreground)] p-4 bg-[color:var(--muted)]/20 rounded-lg text-center">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    articleFilter !== "all"
                      ? "Aucune tâche ne correspond à vos critères de recherche."
                      : "Aucune tâche à venir."}
                  </p>
                ) : (
                  <ul className="space-y-2 pb-4">
                    {upcomingTasks.map((task) => (
                      <motion.li
                        key={task.id}
                        whileTap={{ scale: 0.98 }}
                        className={`cursor-pointer hover:bg-[color:var(--muted)] rounded-lg p-3 text-[color:var(--foreground)] active:bg-[color:var(--muted)]/80 transition-colors shadow-sm border ${getStatusColor(task.status)}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher la propagation ici aussi
                          navigateToTask(task);
                        }}
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{task.name}</span>
                            <span className="text-xs py-0.5 px-2 rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
                              {task.status === "pending"
                                ? "A faire"
                                : task.status === "in_progress"
                                  ? "En cours"
                                  : task.status === "completed"
                                    ? "Terminée"
                                    : task.status === "cancelled"
                                      ? "Annulée"
                                      : task.status}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-[color:var(--muted-foreground)] mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                              {task.realizationDate && (
                                <span className="bg-[color:var(--muted)]/40 py-0.5 px-1.5 rounded">
                                  {formatDate(task.realizationDate)}
                                </span>
                              )}
                              <span>• {task.article.sector.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {task.assignedTo && (
                                <span className="text-xs text-[color:var(--muted-foreground)]">
                                  {task.assignedTo.name}
                                </span>
                              )}

                              <ExternalLink
                                size={14}
                                className="text-[color:var(--muted-foreground)] ml-1"
                              />
                            </div>
                          </div>

                          {/* Titre de l'article */}
                          <div className="mt-1 pt-1 border-t border-[color:var(--border)]/30">
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                              Article: {task.article.title}
                            </span>
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

      {/* Bouton flottant d'expansion moderne sur mobile - affiché uniquement quand l'agenda est fermé */}
      <AnimatePresence>
        {!isExpanded && isMobile && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] flex items-center justify-center shadow-lg z-50"
            onClick={toggleExpanded}
            aria-label="Ouvrir l'agenda"
          >
            <ArrowUp size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay transparent qui capture les clics en dehors de l'agenda en mode mobile PWA */}
      {isExpanded && isMobile && isPWA && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeAgenda}
          style={{ touchAction: "none" }}
        />
      )}
    </>
  );
}
