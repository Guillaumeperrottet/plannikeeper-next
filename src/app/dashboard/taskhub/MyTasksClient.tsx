"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface TaskDocument {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  realizationDate: string | null;
  done: boolean;
  color: string | null;
  taskType: string | null;
  createdAt: string;
  assignedTo: User | null;
  article: {
    id: string;
    title: string;
    sector: {
      id: string;
      name: string;
      image: string | null;
      object: {
        id: string;
        nom: string;
        adresse: string;
        pays: string;
        icon: string | null;
      };
    };
  };
  documents: TaskDocument[];
  comments: Comment[];
}

interface MyTasksClientProps {
  userId: string;
  userName: string;
}

export function MyTasksClient({}: MyTasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedObjectId, setSelectedObjectId] = useState<string>("all");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("me");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // États pour la modal de confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [completionComment, setCompletionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour la lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ src: string; alt: string; title: string }>
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Charger les tâches
  useEffect(() => {
    loadTasks();
  }, []);

  // Filtrer les tâches selon recherche, objet et assigné
  useEffect(() => {
    let filtered = [...tasks];

    // Exclure les tâches terminées (pour usage terrain)
    filtered = filtered.filter((task) => !task.done);

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.article.title.toLowerCase().includes(query) ||
          task.article.sector.object.nom.toLowerCase().includes(query),
      );
    }

    // Filtre par objet
    if (selectedObjectId !== "all") {
      filtered = filtered.filter(
        (task) => task.article.sector.object.id === selectedObjectId,
      );
    }

    // Filtre par assigné
    if (selectedAssigneeId === "me") {
      filtered = filtered.filter(
        (task) => task.assignedTo?.id === currentUserId,
      );
    } else if (selectedAssigneeId !== "all") {
      filtered = filtered.filter(
        (task) => task.assignedTo?.id === selectedAssigneeId,
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, selectedObjectId, selectedAssigneeId, currentUserId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks/my-tasks");
      if (!response.ok) throw new Error("Erreur chargement");
      const data = await response.json();
      setTasks(data.tasks);
      setMembers(data.members);
      setCurrentUserId(data.currentUserId);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les tâches");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const toggleTaskDone = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();

    // Ouvrir la modal de confirmation
    setTaskToComplete(task);
    setIsConfirmModalOpen(true);
  };

  const confirmTaskCompletion = async () => {
    if (!taskToComplete) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Marquage de la tâche...");

    try {
      // 1. Marquer la tâche comme terminée
      const taskResponse = await fetch(`/api/tasks/${taskToComplete.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          done: true,
          status: "completed",
        }),
      });

      if (!taskResponse.ok) throw new Error("Erreur mise à jour tâche");

      // 2. Si un commentaire est fourni, l'ajouter
      if (completionComment.trim()) {
        const commentResponse = await fetch(
          `/api/tasks/${taskToComplete.id}/comments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: completionComment,
            }),
          },
        );

        if (!commentResponse.ok) console.warn("Commentaire non ajouté");
      }

      // Mettre à jour localement (la tâche va disparaître car filtrée)
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskToComplete.id
            ? { ...t, done: true, status: "completed" }
            : t,
        ),
      );

      toast.success("Tâche terminée avec succès !", { id: toastId });

      // Fermer la modal et réinitialiser
      setIsConfirmModalOpen(false);
      setTaskToComplete(null);
      setCompletionComment("");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de terminer la tâche", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelTaskCompletion = () => {
    setIsConfirmModalOpen(false);
    setTaskToComplete(null);
    setCompletionComment("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#d9840c]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Tâches</h1>
        <p className="text-muted-foreground">Toutes vos tâches en cours</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche, article ou objet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={selectedObjectId} onValueChange={setSelectedObjectId}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Sélectionner un objet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les objets</SelectItem>
              {Array.from(
                new Set(tasks.map((t) => t.article.sector.object.id)),
              ).map((objectId) => {
                const object = tasks.find(
                  (t) => t.article.sector.object.id === objectId,
                )?.article.sector.object;
                return (
                  object && (
                    <SelectItem key={object.id} value={object.id}>
                      {object.nom}
                    </SelectItem>
                  )
                );
              })}
            </SelectContent>
          </Select>
          <Select
            value={selectedAssigneeId}
            onValueChange={setSelectedAssigneeId}
          >
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Assigné à" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les tâches</SelectItem>
              <SelectItem value="me">Mes tâches</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des tâches */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Aucune tâche trouvée</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ||
              selectedObjectId !== "all" ||
              selectedAssigneeId !== "me"
                ? "Essayez de modifier vos filtres"
                : "Vous n'avez aucune tâche assignée pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <Card
                key={task.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  toggleTaskExpand(task.id, {
                    stopPropagation: () => {},
                  } as React.MouseEvent)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2 line-clamp-2">
                        {task.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {task.article.sector.object.nom}
                          </span>
                        </div>
                        <span>•</span>
                        <span className="truncate">
                          {task.article.sector.name}
                        </span>
                        <span>•</span>
                        <span className="truncate">{task.article.title}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant={task.done ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => toggleTaskDone(task, e)}
                        className={`${
                          task.done
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : ""
                        }`}
                      >
                        {task.done ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Terminée
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4 mr-1" />
                            Terminer
                          </>
                        )}
                      </Button>
                      <div className="h-6 w-6 flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Description toujours visible */}
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}

                  {/* Détails expansibles */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      {/* Description */}
                      {task.description && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">
                            Description
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {task.description}
                          </p>
                        </div>
                      )}

                      {/* Photos et Documents */}
                      {task.documents.length > 0 && (
                        <div>
                          {(() => {
                            const images = task.documents.filter((doc) =>
                              doc.fileType.startsWith("image/"),
                            );
                            const otherDocs = task.documents.filter(
                              (doc) => !doc.fileType.startsWith("image/"),
                            );

                            return (
                              <>
                                {/* Photos */}
                                {images.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="font-medium text-sm mb-2">
                                      Photos ({images.length})
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {images.slice(0, 6).map((img, idx) => (
                                        <div
                                          key={img.id}
                                          className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:border-primary transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const allImages = images.map(
                                              (i) => ({
                                                src: i.filePath,
                                                alt: i.name,
                                                title: i.name,
                                              }),
                                            );
                                            setLightboxImages(allImages);
                                            setLightboxIndex(idx);
                                            setLightboxOpen(true);
                                          }}
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={img.filePath}
                                            alt={img.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                          />
                                        </div>
                                      ))}
                                      {images.length > 6 && (
                                        <div className="flex items-center justify-center aspect-square rounded-lg border bg-muted text-sm text-muted-foreground">
                                          +{images.length - 6} photo(s)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Autres documents */}
                                {otherDocs.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm mb-2">
                                      Documents ({otherDocs.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {otherDocs.slice(0, 3).map((doc) => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                                        >
                                          <FileText className="h-4 w-4 flex-shrink-0" />
                                          <span className="truncate flex-1">
                                            {doc.name}
                                          </span>
                                        </div>
                                      ))}
                                      {otherDocs.length > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                          + {otherDocs.length - 3} autre(s)
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Commentaires récents */}
                      {task.comments.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Commentaires récents
                          </h4>
                          <div className="space-y-2">
                            {task.comments.slice(0, 2).map((comment) => (
                              <div
                                key={comment.id}
                                className="text-sm p-2 bg-muted rounded"
                              >
                                <p className="font-medium text-xs mb-1">
                                  {comment.user.name}
                                </p>
                                <p className="text-muted-foreground line-clamp-2">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                            {task.comments.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                + {task.comments.length - 2} autre(s)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bouton pour voir/modifier la tâche */}
                      <div className="mt-4 pt-4 border-t">
                        <Link
                          href={`/dashboard/objet/${task.article.sector.object.id}/secteur/${task.article.sector.id}/article/${task.article.id}/task/${task.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Voir la tâche
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de confirmation de complétion */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Terminer la tâche</DialogTitle>
            <DialogDescription>
              Confirmez que cette tâche est terminée. Vous pouvez ajouter un
              commentaire pour documenter ce qui a été fait.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {taskToComplete && (
              <div className="text-sm">
                <p className="font-medium mb-1">{taskToComplete.name}</p>
                <p className="text-muted-foreground text-xs">
                  {taskToComplete.article.sector.object.nom} •{" "}
                  {taskToComplete.article.sector.name} •{" "}
                  {taskToComplete.article.title}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="completion-comment">
                Commentaire (optionnel)
              </Label>
              <Textarea
                id="completion-comment"
                placeholder="Ex: Réparation effectuée, matériel remplacé..."
                value={completionComment}
                onChange={(e) => setCompletionComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelTaskCompletion}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={confirmTaskCompletion}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox pour les images */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
