"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Archive,
  Building,
  SortAsc,
  SortDesc,
  RefreshCcw,
  User,
  Filter as FilterIcon,
  Printer,
  Home,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ArchiveButton from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/ArchiveButton";

// Types
type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  realizationDate: Date | null;
  archivedAt: Date | null;
  recurring: boolean;
  period: string | null;
  taskType: string | null;
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
};

type Object = {
  id: string;
  nom: string;
};

export default function ArchivesPage() {
  // États
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("archivedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const printRef = useRef<HTMLDivElement>(null);

  // Chargement initial des données
  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await fetch("/api/objet");
        if (response.ok) {
          const data = await response.json();
          setObjects(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des objets:", error);
      }
    };

    fetchObjects();
    fetchArchivedTasks();
  }, []);

  // Récupération des tâches archivées avec filtres
  const fetchArchivedTasks = async () => {
    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtrage
      let url = "/api/tasks/archives?";
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (selectedObject) params.append("objectId", selectedObject);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      url += params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tâches archivées");
      }

      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des tâches archivées");
    } finally {
      setLoading(false);
    }
  };

  // Applique les filtres
  const applyFilters = () => {
    fetchArchivedTasks();
  };

  // Réinitialise les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedObject(null);
    setFromDate("");
    setToDate("");
    setSortBy("archivedAt");
    setSortOrder("desc");

    // Réinitialiser également le formulaire de recherche
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    if (searchInput) searchInput.value = "";

    // Puis refaire la recherche
    setTimeout(fetchArchivedTasks, 0);
  };

  // Formater les dates pour l'affichage
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Gestionnaire d'archive
  const handleArchiveToggle = (taskId: string, newArchiveState: boolean) => {
    if (!newArchiveState) {
      // Si on désarchive, on retire la tâche de la liste
      setTasks(tasks.filter((task) => task.id !== taskId));
    } else {
      // Sinon, on met à jour son statut
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, archived: newArchiveState } : task
        )
      );
    }
  };

  // Impression
  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    // CSS pour l'impression
    const style = `
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        .print-header { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .object-group { margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        @media print {
          body { font-size: 12px; }
          h1 { font-size: 18px; }
          th, td { padding: 5px; }
        }
      </style>
    `;

    // Construction du document d'impression
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Archives de tâches - PlanniKeeper</title>
          ${style}
        </head>
        <body>
          <div class="print-header">
            <h1>Archives de tâches - PlanniKeeper</h1>
            <p>Date d'impression: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            ${selectedObject ? `<p>Objet: ${objects.find((obj) => obj.id === selectedObject)?.nom || "Tous"}</p>` : ""}
            ${fromDate ? `<p>Période: du ${formatDate(fromDate)}${toDate ? ` au ${formatDate(toDate)}` : ""}</p>` : ""}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Objet</th>
                <th>Secteur/Article</th>
                <th>Date d'archive</th>
                <th>Assigné à</th>
              </tr>
            </thead>
            <tbody>
              ${tasks
                .map(
                  (task) => `
                <tr>
                  <td>${task.name}</td>
                  <td>${task.article.sector.object.nom}</td>
                  <td>${task.article.sector.name} / ${task.article.title}</td>
                  <td>${formatDate(task.archivedAt)}</td>
                  <td>${task.assignedTo?.name || "Non assigné"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Document généré par PlanniKeeper - ${tasks.length} tâches archivées</p>
          </div>
        </body>
      </html>
    `);

    // Fermer le document et lancer l'impression
    printWindow.document.close();

    // Attendre que le contenu soit chargé
    printWindow.onload = function () {
      printWindow.print();
    };
  };

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* En-tête fixe avec actions */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline font-medium">Retour</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold ml-2 flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Archives des tâches
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-1"
              title="Imprimer les archives"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barre de recherche et filtres */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-4 h-4" />
              <input
                id="search-input"
                type="text"
                placeholder="Rechercher des tâches archivées..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md ${
                  showFilters
                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                }`}
                title="Afficher les filtres"
              >
                <FilterIcon className="w-4 h-4" />
              </button>

              <button
                onClick={applyFilters}
                className="px-3 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-md shadow-sm hover:opacity-90 text-sm"
              >
                Rechercher
              </button>
            </div>
          </div>

          {/* Section des filtres avancés */}
          {showFilters && (
            <div className="mt-4 p-4 bg-[color:var(--background)] border border-[color:var(--border)] rounded-md">
              <h3 className="text-sm font-medium mb-3">Filtres avancés</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Filtre par objet */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-[color:var(--foreground)]">
                    Objet
                  </label>
                  <select
                    value={selectedObject || ""}
                    onChange={(e) => setSelectedObject(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                  >
                    <option value="">Tous les objets</option>
                    {objects.map((object) => (
                      <option key={object.id} value={object.id}>
                        {object.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre par date (de) */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-[color:var(--foreground)]">
                    Archivé à partir du
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                  />
                </div>

                {/* Filtre par date (à) */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-[color:var(--foreground)]">
                    Archivé jusqu&apos;au
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                  />
                </div>

                {/* Tri */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-[color:var(--foreground)]">
                    Trier par
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                    >
                      <option value="archivedAt">Date d&apos;archivage</option>
                      <option value="name">Nom</option>
                      <option value="realizationDate">
                        Date d&apos;échéance
                      </option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="px-3 py-2 bg-[color:var(--muted)] text-[color:var(--foreground)] rounded-md hover:bg-[color:var(--muted)]"
                      title={
                        sortOrder === "asc"
                          ? "Ordre décroissant"
                          : "Ordre croissant"
                      }
                    >
                      {sortOrder === "asc" ? (
                        <SortAsc className="w-4 h-4" />
                      ) : (
                        <SortDesc className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton de réinitialisation */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs bg-[color:var(--muted)] text-[color:var(--foreground)] rounded-md hover:bg-[color:var(--muted)] hover:opacity-80"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone de contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-[color:var(--primary)] animate-spin mb-4" />
            <p className="text-[color:var(--muted-foreground)]">
              Chargement des archives...
            </p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-[color:var(--card)] rounded-lg border border-[color:var(--border)]">
            <Archive className="w-12 h-12 text-[color:var(--muted-foreground)] mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Aucune tâche archivée trouvée
            </h3>
            <p className="text-[color:var(--muted-foreground)] mb-6">
              Les tâches que vous archivez apparaîtront ici pour référence
              future.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-md shadow-sm hover:opacity-90"
            >
              <Home className="w-4 h-4" />
              Retour au tableau de bord
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium">
                {tasks.length} tâche{tasks.length !== 1 ? "s" : ""} archivée
                {tasks.length !== 1 ? "s" : ""}
              </h2>
            </div>

            {/* Zone visible pour l'impression */}
            <div className="hidden">
              <div ref={printRef}>
                {/* Le contenu sera généré dynamiquement lors de l'impression */}
              </div>
            </div>

            {/* Liste des tâches archivées */}
            <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[color:var(--muted)] border-b border-[color:var(--border)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase">
                      Tâche
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase hidden sm:table-cell">
                      Objet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase hidden md:table-cell">
                      Secteur / Article
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase hidden lg:table-cell">
                      Date d&apos;archivage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase hidden lg:table-cell">
                      Assigné à
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--foreground)] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[color:var(--muted)]">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: task.color || "#d9840d" }}
                          />
                          <span className="font-medium truncate max-w-[150px] sm:max-w-[250px]">
                            {task.name}
                          </span>
                          {task.recurring && (
                            <span title="Tâche récurrente">
                              <RefreshCcw className="w-3 h-3 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--foreground)] hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[color:var(--muted-foreground)]" />
                          <span className="truncate max-w-[120px]">
                            {task.article.sector.object.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--foreground)] hidden md:table-cell">
                        <span className="truncate block max-w-[180px]">
                          {task.article.sector.name} / {task.article.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--foreground)] hidden lg:table-cell">
                        {formatDate(task.archivedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--foreground)] hidden lg:table-cell">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[color:var(--muted-foreground)]" />
                            <span>{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-[color:var(--muted-foreground)]">
                            Non assigné
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[color:var(--foreground)]">
                        <div className="flex items-center gap-3">
                          <ArchiveButton
                            taskId={task.id}
                            isArchived={true}
                            onArchiveToggle={(archived) =>
                              handleArchiveToggle(task.id, archived)
                            }
                            showText={true}
                          />

                          <Link
                            href={`/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`}
                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <span>Détails</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
