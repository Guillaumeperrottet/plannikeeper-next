"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  Calendar,
  Archive,
  Building,
  RefreshCcw,
  User,
  Filter as FilterIcon,
  Printer,
  ArrowLeft,
  Loader2,
  Tag,
  Layers,
  RotateCcw,
  Eye,
  Home,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Label } from "@/app/components/ui/label";

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

type ArticleOption = {
  id: string;
  title: string;
  sectorId: string;
  sectorName: string;
  objectId: string;
  objectName: string;
};

type AssigneeOption = {
  id: string;
  name: string;
};

export default function ArchivesPage() {
  // États
  const [tasks, setTasks] = useState<Task[]>([]);
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [selectedTaskType, setSelectedTaskType] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortField, setSortField] = useState<string>("archivedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Métadonnées pour les filtres
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  // Récupération des tâches archivées avec filtres
  const fetchArchivedTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Construire l'URL avec les paramètres de filtrage
      let url = "/api/tasks/archives?";
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (selectedObject) params.append("objectId", selectedObject);
      if (selectedTaskType) params.append("taskType", selectedTaskType);
      if (selectedArticle) params.append("articleId", selectedArticle);
      if (selectedAssignee) params.append("assigneeId", selectedAssignee);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);

      url += params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des tâches archivées");
      }

      const data = await response.json();
      setTasks(data.tasks);

      // Mettre à jour les métadonnées pour les filtres
      if (data.metadata) {
        setTaskTypes(data.metadata.taskTypes || []);
        setArticles(data.metadata.articles || []);
        setAssignees(data.metadata.assignees || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des tâches archivées");
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedObject,
    selectedTaskType,
    selectedArticle,
    selectedAssignee,
    fromDate,
    toDate,
    sortField,
    sortDirection,
  ]);

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
  }, []);

  // Effet séparé pour le chargement initial des tâches
  useEffect(() => {
    fetchArchivedTasks();
  }, [fetchArchivedTasks]);

  // Surveiller les changements de tri et appliquer automatiquement
  useEffect(() => {
    if (sortField && sortDirection) {
      fetchArchivedTasks();
    }
  }, [sortField, sortDirection, fetchArchivedTasks]);

  // Filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedObject) count++;
    if (selectedTaskType) count++;
    if (selectedArticle) count++;
    if (selectedAssignee) count++;
    if (fromDate) count++;
    if (toDate) count++;
    if (searchQuery) count++;
    return count;
  }, [
    selectedObject,
    selectedTaskType,
    selectedArticle,
    selectedAssignee,
    fromDate,
    toDate,
    searchQuery,
  ]);

  // Applique les filtres
  const applyFilters = () => {
    fetchArchivedTasks();
  };

  // Réinitialise les filtres
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedObject(null);
    setSelectedTaskType(null);
    setSelectedArticle(null);
    setSelectedAssignee(null);
    setFromDate("");
    setToDate("");
    setSortField("archivedAt");
    setSortDirection("desc");

    // Réinitialiser également le formulaire de recherche
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    if (searchInput) searchInput.value = "";

    // Puis refaire la recherche
    setTimeout(fetchArchivedTasks, 0);
  };

  // Gestion du tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="w-4 h-4" />
      ) : (
        <ArrowDown className="w-4 h-4" />
      );
    }
    // Utiliser l'icône de tri bidirectionnel par défaut
    return <ArrowUpDown className="w-4 h-4 text-gray-300" />;
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

    // Récupérer le contenu à imprimer

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

    // Construire les filtres pour l'en-tête d'impression
    const filterDescriptions = [];
    if (selectedObject) {
      const objectName =
        objects.find((obj) => obj.id === selectedObject)?.nom || "Inconnu";
      filterDescriptions.push(`Objet: ${objectName}`);
    }
    if (selectedTaskType) {
      filterDescriptions.push(`Type: ${selectedTaskType}`);
    }
    if (selectedArticle) {
      const article = articles.find((a) => a.id === selectedArticle);
      if (article) {
        filterDescriptions.push(`Article: ${article.title}`);
      }
    }
    if (selectedAssignee) {
      const assignee = assignees.find((a) => a.id === selectedAssignee);
      if (assignee) {
        filterDescriptions.push(`Assigné à: ${assignee.name}`);
      }
    }
    if (fromDate) {
      filterDescriptions.push(`Du: ${formatDate(fromDate)}`);
    }
    if (toDate) {
      filterDescriptions.push(`Au: ${formatDate(toDate)}`);
    }

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
            ${filterDescriptions.map((desc) => `<p>${desc}</p>`).join("")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Type</th>
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
                  <td>${task.taskType || "Non défini"}</td>
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
    <div className="min-h-screen bg-background">
      {/* Zone de contenu principal unifiée */}
      <main className="max-w-[1400px] mx-auto px-4 py-4">
        <Card className="w-full">
          <CardHeader className="space-y-4 pb-4">
            {/* En-tête avec titre et bouton d'impression */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Retour</span>
                </Link>
                <div className="flex items-center gap-3">
                  <Archive className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-semibold text-foreground">
                    Archives des tâches
                  </h1>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </Button>
            </div>

            {/* Barre de recherche et actions principales */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher des tâches archivées..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={applyFilters} size="sm" className="gap-2">
                  <Search className="h-4 w-4" />
                  Rechercher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>

            {/* Filtres compacts en ligne */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FilterIcon className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} actif
                    {activeFiltersCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Première ligne de filtres */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {/* Filtre par objet */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Objet
                  </Label>
                  <Select
                    value={selectedObject || "all"}
                    onValueChange={(value) =>
                      setSelectedObject(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les objets</SelectItem>
                      {objects.map((object) => (
                        <SelectItem key={object.id} value={object.id}>
                          {object.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par type */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Type
                  </Label>
                  <Select
                    value={selectedTaskType || "all"}
                    onValueChange={(value) =>
                      setSelectedTaskType(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {taskTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par article */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Article
                  </Label>
                  <Select
                    value={selectedArticle || "all"}
                    onValueChange={(value) =>
                      setSelectedArticle(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les articles</SelectItem>
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={article.id}>
                          {article.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par assigné */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Assigné
                  </Label>
                  <Select
                    value={selectedAssignee || "all"}
                    onValueChange={(value) =>
                      setSelectedAssignee(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les assignés</SelectItem>
                      <SelectItem value="null">Non assigné</SelectItem>
                      {assignees.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          {assignee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date de début */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Du
                  </Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Date de fin */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Au
                  </Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">
                  Chargement des archives...
                </p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="space-y-4">
                  <Archive className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Aucune tâche archivée trouvée
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {activeFiltersCount > 0
                        ? "Essayez de modifier vos filtres pour voir plus de résultats."
                        : "Les tâches que vous archivez apparaîtront ici pour référence future."}
                    </p>
                    <Button asChild>
                      <Link href="/dashboard" className="gap-2">
                        <Home className="w-4 h-4" />
                        Retour au tableau de bord
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {/* En-tête des résultats compact */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <h2 className="text-lg font-medium">
                      {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}{" "}
                      archivée{tasks.length !== 1 ? "s" : ""}
                    </h2>
                    {activeFiltersCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeFiltersCount} filtre(s) actif(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Table des résultats */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px] text-xs font-medium text-gray-500 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("name")}
                            className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            TÂCHE
                            {getSortIcon("name")}
                          </Button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell text-xs font-medium text-gray-500 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("taskType")}
                            className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            TYPE
                            {getSortIcon("taskType")}
                          </Button>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-xs font-medium text-gray-500 py-3">
                          OBJET
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-xs font-medium text-gray-500 py-3">
                          SECTEUR / ARTICLE
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-xs font-medium text-gray-500 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("archivedAt")}
                            className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            DATE D&apos;ARCHIVAGE
                            {getSortIcon("archivedAt")}
                          </Button>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-xs font-medium text-gray-500 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("assignedTo")}
                            className="h-auto p-0 font-medium text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            ASSIGNÉ À{getSortIcon("assignedTo")}
                          </Button>
                        </TableHead>
                        <TableHead className="w-[120px] text-xs font-medium text-gray-500 py-3">
                          ACTIONS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: task.color || "#d9840d",
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">
                                  {task.name}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                              {task.recurring && (
                                <Badge variant="outline" className="gap-1">
                                  <RefreshCcw className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    Récurrente
                                  </span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            {task.taskType ? (
                              <Badge variant="secondary" className="gap-1">
                                <Tag className="w-3 h-3" />
                                {task.taskType}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Non défini
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[120px]">
                                {task.article.sector.object.nom}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[180px]">
                                {task.article.sector.name} /{" "}
                                {task.article.title}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(task.archivedAt)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="hidden lg:table-cell">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {task.assignedTo.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Non assigné
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleArchiveToggle(task.id, false)
                                }
                                className="gap-1 h-8 text-xs"
                                title="Désarchiver cette tâche pour pouvoir la modifier"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  Désarchiver
                                </span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-1 h-8 text-xs"
                                title="Consulter les détails (lecture seule)"
                              >
                                <Link
                                  href={`/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}?readonly=true`}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    Consulter
                                  </span>
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
