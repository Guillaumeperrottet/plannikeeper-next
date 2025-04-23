"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  realizationDate: string | null;
  status: string;
  article: {
    id: string; // ajouté
    title: string;
    sector: {
      id: string; // ajouté
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

type AppObject = {
  id: string;
  nom: string;
};

export default function TodoListAgenda() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [startY, setStartY] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<AppObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const agendaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Récupération des objets
  useEffect(() => {
    const fetchObjects = async (): Promise<void> => {
      try {
        const response = await fetch("/api/objects");
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

  // Récupération des tâches quand on change d’objet
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

  // Glissement pour ouvrir/fermer
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    const deltaY = startY - e.touches[0].clientY;
    if (deltaY > 50 && !isExpanded) setIsExpanded(true);
    else if (deltaY < -50 && isExpanded) setIsExpanded(false);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    setStartY(e.clientY);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (e: MouseEvent): void => {
    const deltaY = startY - e.clientY;
    if (deltaY > 50 && !isExpanded) {
      setIsExpanded(true);
      removeMouseListeners();
    } else if (deltaY < -50 && isExpanded) {
      setIsExpanded(false);
      removeMouseListeners();
    }
  };
  const handleMouseUp = (): void => {
    removeMouseListeners();
  };
  const removeMouseListeners = (): void => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
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

  return (
    <div
      ref={agendaRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-200 transition-all duration-300 shadow-lg print:shadow-none print:relative print:h-auto"
      style={{
        height: isExpanded ? "60vh" : "48px",
        zIndex: 40,
      }}
    >
      {/* Barre de titre */}
      <div
        className="flex justify-between items-center bg-gray-800 text-white p-3 cursor-grab print:cursor-default"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
      >
        <h2 className="text-xl font-semibold">Agenda todo list</h2>
        <div className="flex items-center gap-2">
          <select
            className="bg-white text-gray-800 px-3 py-1 rounded border-none text-sm mr-2"
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
            className="p-1 rounded hover:bg-gray-700 print:hidden"
          >
            <Printer size={20} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="print:hidden"
          >
            {isExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="overflow-y-auto h-[calc(100%-48px)] print:h-auto">
        {isLoading ? (
          <div className="p-4 text-center">Chargement des tâches...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Cette semaine */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Cette semaine</h3>
              {thisWeekTasks.length === 0 ? (
                <p className="text-gray-500">
                  Aucune tâche pour cette semaine.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {thisWeekTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-gray-500 mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-gray-500 ml-1">
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
                <p className="text-gray-500">Aucune tâche à venir.</p>
              ) : (
                <ul className="list-disc list-inside space-y-2">
                  {upcomingTasks.map((task) => (
                    <li
                      key={task.id}
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => navigateToTask(task)}
                    >
                      {task.realizationDate && (
                        <span className="text-sm text-gray-500 mr-2">
                          {formatDate(task.realizationDate)} -
                        </span>
                      )}
                      <span>{task.name}</span>
                      <span className="text-sm text-gray-500 ml-1">
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
