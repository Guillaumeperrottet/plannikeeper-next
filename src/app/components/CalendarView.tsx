import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Filter,
  CheckSquare,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TaskDetailPopup from "@/app/components/TaskDetailPopup";
import CalendarMiniTask from "@/app/components/CalendarMiniTask";
import CalendarHints from "@/app/components/CalendarHints";

type CalendarViewProps = {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  objectId: string;
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
};

type Day = {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onTaskClick,
  objectId,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayTasksList, setShowDayTasksList] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Génération des données du calendrier
  const { days, monthName, year } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthName = new Date(year, month, 1).toLocaleString("default", {
      month: "long",
    });

    // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Dernier jour du mois
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startOffset; i++) {
      const day = prevMonthLastDay - startOffset + i + 1;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month - 1, day),
      });
    }

    // Jours du mois courant
    for (let day = 1; day <= lastDayOfMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Compléter la dernière semaine avec les jours du mois suivant
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          isCurrentMonth: false,
          date: new Date(year, month + 1, day),
        });
      }
    }

    return {
      days,
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      year,
    };
  }, [currentMonth]);

  // Filtrer les tâches en fonction du statut
  const filteredTasks = useMemo(() => {
    if (statusFilter.length === 0) return tasks;
    return tasks.filter((task) => statusFilter.includes(task.status));
  }, [tasks, statusFilter]);

  // Obtenir les tâches pour un jour spécifique
  const getTasksForDay = (date: Date) => {
    return filteredTasks.filter((task) => {
      if (!task.realizationDate) return false;

      const taskDate = new Date(task.realizationDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Obtenir les couleurs pour chaque jour basées sur les tâches
  const getDayColors = (date: Date) => {
    const dayTasks = getTasksForDay(date);

    // Si pas de tâches, retourne un tableau vide
    if (dayTasks.length === 0) return [];

    // Retourne les couleurs des 3 premières tâches (ou moins s'il y en a moins)
    return dayTasks.slice(0, 3).map((task) => task.color || "var(--primary)");
  };

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Vérifier si la date est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Formatage des noms de jours avec 2 lettres
  const weekDays = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  // Gestion des clics sur une tâche et un jour
  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
  };

  const handleDayClick = (day: Day) => {
    if (!day.isCurrentMonth) return; // Ne rien faire si on clique sur un jour du mois précédent/suivant

    setSelectedDate(day.date);
    setShowDayTasksList(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
  };

  const closeDayTasksList = () => {
    setShowDayTasksList(false);
    setSelectedDate(null);
  };

  // Toggle pour le filtre de statut
  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter((s) => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // Formatage de date pour l'affichage
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Composant d'astuces pour les nouveaux utilisateurs */}
      <CalendarHints />
      {/* En-tête du calendrier */}
      <div className="flex justify-between items-center mb-2 px-2 py-1">
        <button
          onClick={goToPreviousMonth}
          className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex gap-2 items-center">
          <h3 className="text-lg font-semibold">
            {monthName} {year}
          </h3>
          <button
            onClick={goToCurrentMonth}
            className="text-xs px-2 py-0.5 bg-muted rounded-md hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => {}}
              className={`p-1 rounded-full hover:bg-muted transition-colors ${
                statusFilter.length > 0
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Filter size={18} />
            </button>

            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg hidden group-hover:block z-10">
              <div className="p-2">
                <div className="text-xs font-medium mb-1 uppercase text-muted-foreground">
                  Statut
                </div>
                <div className="space-y-1">
                  <button
                    className={`flex items-center gap-1 w-full px-1.5 py-1 text-xs rounded ${
                      statusFilter.includes("pending")
                        ? "bg-warning-background text-warning-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleStatusFilter("pending")}
                  >
                    <CheckSquare
                      size={12}
                      className={
                        !statusFilter.includes("pending") ? "opacity-0" : ""
                      }
                    />
                    <span>À faire</span>
                  </button>
                  <button
                    className={`flex items-center gap-1 w-full px-1.5 py-1 text-xs rounded ${
                      statusFilter.includes("in_progress")
                        ? "bg-info-background text-info-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleStatusFilter("in_progress")}
                  >
                    <CheckSquare
                      size={12}
                      className={
                        !statusFilter.includes("in_progress") ? "opacity-0" : ""
                      }
                    />
                    <span>En cours</span>
                  </button>
                  <button
                    className={`flex items-center gap-1 w-full px-1.5 py-1 text-xs rounded ${
                      statusFilter.includes("completed")
                        ? "bg-success-background text-success-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleStatusFilter("completed")}
                  >
                    <CheckSquare
                      size={12}
                      className={
                        !statusFilter.includes("completed") ? "opacity-0" : ""
                      }
                    />
                    <span>Terminée</span>
                  </button>
                  <button
                    className={`flex items-center gap-1 w-full px-1.5 py-1 text-xs rounded ${
                      statusFilter.includes("cancelled")
                        ? "bg-destructive-background text-destructive-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleStatusFilter("cancelled")}
                  >
                    <CheckSquare
                      size={12}
                      className={
                        !statusFilter.includes("cancelled") ? "opacity-0" : ""
                      }
                    />
                    <span>Annulée</span>
                  </button>
                </div>
              </div>

              {statusFilter.length > 0 && (
                <div className="border-t border-border p-1.5">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground w-full text-left"
                    onClick={() => setStatusFilter([])}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grille du calendrier avec animation */}
      <motion.div
        className="grid grid-cols-7 gap-1 flex-grow"
        key={`${currentMonth.getMonth()}-${currentMonth.getFullYear()}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Jours de la semaine */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs py-1 font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Jours du mois */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDay(day.date);
          const dayColors = getDayColors(day.date);

          return (
            <div
              key={index}
              className={`
                relative h-16 border rounded-md p-1 overflow-hidden cursor-pointer
                ${
                  day.isCurrentMonth
                    ? "bg-card hover:bg-muted/50"
                    : "bg-muted/30 cursor-default"
                }
                ${isToday(day.date) ? "border-primary" : "border-border"}
              `}
              onClick={() => handleDayClick(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`
                    text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full
                    ${
                      isToday(day.date)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }
                    ${!day.isCurrentMonth ? "text-muted-foreground" : ""}
                  `}
                >
                  {day.day}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayColors.length > 0 ? (
                      dayColors.map((color, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))
                    ) : (
                      <span className="text-xs bg-muted px-1 rounded-full">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto max-h-[calc(100%-1.25rem)]">
                {dayTasks.slice(0, 3).map((task) => (
                  <CalendarMiniTask
                    key={task.id}
                    task={task}
                    onClick={(e) => handleTaskClick(task, e)}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <div
                    className="text-xs text-muted-foreground text-center cursor-pointer hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(day.date);
                      setShowDayTasksList(true);
                    }}
                  >
                    + {dayTasks.length - 3} plus
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Popup des détails d'une tâche */}
      {selectedTask && (
        <TaskDetailPopup
          task={selectedTask}
          onClose={closeTaskDetail}
          onNavigate={onTaskClick}
        />
      )}

      {/* Liste des tâches d'un jour */}
      {showDayTasksList && selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeDayTasksList}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {formatDate(selectedDate)}
              </h3>
              <button
                onClick={closeDayTasksList}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {getTasksForDay(selectedDate).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Aucune tâche pour cette journée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getTasksForDay(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="p-2 border border-border rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-10 rounded-sm"
                        style={{
                          backgroundColor: task.color || "var(--primary)",
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{task.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.article.sector.name}
                        </div>
                      </div>

                      <div
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          task.status === "pending"
                            ? "bg-warning-background text-warning-foreground"
                            : task.status === "in_progress"
                            ? "bg-info-background text-info-foreground"
                            : task.status === "completed"
                            ? "bg-success-background text-success-foreground"
                            : "bg-destructive-background text-destructive-foreground"
                        }`}
                      >
                        {task.status === "pending"
                          ? "À faire"
                          : task.status === "in_progress"
                          ? "En cours"
                          : task.status === "completed"
                          ? "Terminée"
                          : "Annulée"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
