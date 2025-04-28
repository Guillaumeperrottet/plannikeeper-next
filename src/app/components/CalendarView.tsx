"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

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
  assignedTo: {
    id: string;
    name: string;
  } | null;
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
  createdAt: Date;
  updatedAt: Date;
};

interface CalendarViewProps {
  tasks: Task[];
  navigateToTask: (task: Task) => void;
}

export default function CalendarView({
  tasks,
  navigateToTask,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<Date | null>>([]);
  const [tasksByDay, setTasksByDay] = useState<Record<string, Task[]>>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Helper to format date as YYYY-MM-DD for use as keys
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Generate calendar days for current month view
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Starting day of the week (0 = Sunday, 1 = Monday, etc.)
    let dayOfWeek = firstDay.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Adjust Sunday to be 7 instead of 0 for European calendars

    const daysInMonth = lastDay.getDate();

    // Calculate previous month days to show
    const previousMonthDays = dayOfWeek - 1;

    // Generate array of dates for the calendar
    const calendarDaysArray: Array<Date | null> = [];

    // Add previous month days
    for (let i = previousMonthDays - 1; i >= 0; i--) {
      const prevMonthDate = new Date(year, month, -i);
      calendarDaysArray.push(prevMonthDate);
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDaysArray.push(new Date(year, month, i));
    }

    // Add next month days to fill out the grid (always show 6 weeks)
    const totalDays = 42; // 6 weeks * 7 days
    const nextMonthDays = totalDays - calendarDaysArray.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      calendarDaysArray.push(new Date(year, month + 1, i));
    }

    setCalendarDays(calendarDaysArray);
  }, [currentDate]);

  // Organize tasks by day
  useEffect(() => {
    const taskMap: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      if (task.realizationDate) {
        const dateKey = formatDateKey(new Date(task.realizationDate));
        if (!taskMap[dateKey]) {
          taskMap[dateKey] = [];
        }
        taskMap[dateKey].push(task);
      }
    });

    setTasksByDay(taskMap);
  }, [tasks]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Navigate to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Get task color based on status
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

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Month and year header
  const monthYearString = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Days of week header
  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with navigation */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-[color:var(--border)]">
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-[color:var(--muted)]"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-[color:var(--muted)]"
            aria-label="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <h2 className="text-lg font-semibold flex items-center">
          <CalendarIcon className="mr-2" size={20} />
          {monthYearString}
        </h2>

        <button
          onClick={goToCurrentMonth}
          className="px-3 py-1 text-sm rounded border border-[color:var(--border)] hover:bg-[color:var(--muted)]"
        >
          Aujourd'hui
        </button>
      </div>

      {/* Modal Dialog for day details */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeDialog}
        >
          <div
            ref={dialogRef}
            className="bg-[color:var(--background)] rounded-lg shadow-lg max-w-md w-full max-h-[80vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[color:var(--border)]">
              <h3 className="text-lg font-semibold">
                {formatDateLong(selectedDay)}
              </h3>
              <button
                onClick={closeDialog}
                className="p-1 rounded-full hover:bg-[color:var(--muted)]"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-4">
              {selectedDayTasks.length === 0 ? (
                <p className="text-[color:var(--muted-foreground)] text-center py-4">
                  Aucune tâche prévue pour cette journée
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        navigateToTask(task);
                        closeDialog();
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${getStatusColor(
                        task.status
                      )} hover:opacity-90`}
                    >
                      <div className="font-medium">{task.name}</div>
                      {task.description && (
                        <div className="text-sm mt-1 opacity-90 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span>{task.article.sector.name}</span>
                        {task.assignedTo && (
                          <span>Assigné à: {task.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[color:var(--border)] text-center">
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Days of week header */}
      <div className="grid grid-cols-7 text-center py-2 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
        {daysOfWeek.map((day, index) => (
          <div key={index} className="text-xs font-medium">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {calendarDays.map((date, index) => {
            if (!date)
              return (
                <div
                  key={index}
                  className="border border-[color:var(--border)] p-1"
                ></div>
              );

            const dateKey = formatDateKey(date);
            const dayTasks = tasksByDay[dateKey] || [];
            const hasTask = dayTasks.length > 0;
            const isCurrentDay = isToday(date);
            const inCurrentMonth = isCurrentMonth(date);

            return (
              <div
                key={index}
                className={`border border-[color:var(--border)] p-1 transition-all duration-200 relative ${
                  !inCurrentMonth ? "bg-[color:var(--muted)] opacity-50" : ""
                } ${
                  isCurrentDay ? "bg-[color:var(--primary)] bg-opacity-10" : ""
                }
                ${
                  hasTask && inCurrentMonth
                    ? "hover:bg-[color:var(--muted)] hover:shadow-inner"
                    : ""
                }
                ${inCurrentMonth ? "cursor-pointer" : ""}`}
                onClick={() => handleDateClick(date)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center">
                    <div
                      className={`text-right text-xs mb-1 ${
                        isCurrentDay
                          ? "font-bold text-[color:var(--primary)]"
                          : inCurrentMonth
                          ? "text-[color:var(--foreground)]"
                          : "text-[color:var(--muted-foreground)]"
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Indicateur de tâches */}
                    {hasTask && inCurrentMonth && (
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)]"></span>
                        {dayTasks.length > 1 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] opacity-70"></span>
                        )}
                        {dayTasks.length > 2 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)] opacity-40"></span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {dayTasks.length > 0 ? (
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => navigateToTask(task)}
                            className={`px-1 py-0.5 text-xs rounded truncate cursor-pointer ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.name}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-center text-[color:var(--muted-foreground)]">
                            +{dayTasks.length - 3} autres
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
