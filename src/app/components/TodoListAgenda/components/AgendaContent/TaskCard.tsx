// Carte de tâche réutilisable avec actions rapides et images
"use client";

import { motion } from "framer-motion";
import { ExternalLink, Check, Clock, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Task } from "../../types";
import { formatDate } from "../../utils/dateHelpers";
import { getStatusBadgeVariant, getStatusText } from "../../utils/taskFilters";
import { useState } from "react";

interface TaskDocument {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => Promise<void>;
  onQuickComplete?: (taskId: string) => Promise<void>;
}

export const TaskCard = ({ task, onClick, onQuickComplete }: TaskCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleQuickComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting || !onQuickComplete || task.done) return;

    setIsCompleting(true);
    try {
      await onQuickComplete(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(task);
  };

  // Extraire les images des documents (si disponibles)
  const taskDocuments = ((task as Task & { documents?: TaskDocument[] })
    .documents || []) as TaskDocument[];
  const imageDocuments = taskDocuments
    .filter((doc: TaskDocument) => doc.fileType?.startsWith("image/"))
    .slice(0, 3); // Max 3 images

  const hasImages = imageDocuments.length > 0;

  return (
    <motion.li key={task.id} whileTap={{ scale: 0.98 }}>
      <div className="flex gap-2 items-stretch">
        {/* Card principale */}
        <Card
          className="cursor-pointer hover:shadow-md transition-all bg-stone-50/50 border-stone-200/60 hover:border-stone-300 group relative overflow-hidden flex-1"
          onClick={handleCardClick}
        >
          {/* Barre de statut colorée à gauche */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
              task.done
                ? "bg-green-500"
                : task.status === "in_progress"
                  ? "bg-blue-500"
                  : task.status === "overdue"
                    ? "bg-red-500"
                    : "bg-amber-500"
            }`}
          />

          <CardContent className="p-3 pl-4">
            <div className="flex flex-col gap-2">
              {/* Header avec titre et badge */}
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium line-clamp-2 flex-1">
                  {task.name}
                </span>

                <Badge
                  variant={
                    getStatusBadgeVariant(task.status) as
                      | "warning"
                      | "info"
                      | "success"
                      | "destructive"
                      | "secondary"
                  }
                  className="flex-shrink-0"
                >
                  {getStatusText(task.status)}
                </Badge>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Images miniatures */}
              {hasImages && (
                <div className="flex gap-1.5 mt-1">
                  {imageDocuments.map((doc: TaskDocument) => (
                    <div
                      key={doc.id}
                      className="relative w-12 h-12 rounded overflow-hidden bg-muted border border-border flex-shrink-0"
                      title={doc.name}
                    >
                      <Image
                        src={doc.filePath}
                        alt={doc.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {taskDocuments.length > 3 && (
                    <div className="flex items-center justify-center w-12 h-12 rounded bg-muted border border-border text-xs text-muted-foreground">
                      +{taskDocuments.length - 3}
                    </div>
                  )}
                </div>
              )}

              {/* Infos secondaires */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                  {task.realizationDate && (
                    <span className="flex items-center gap-1 bg-muted/40 py-0.5 px-1.5 rounded">
                      <Clock size={12} />
                      {formatDate(task.realizationDate)}
                    </span>
                  )}
                  <span>• {task.article.sector.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {task.assignedTo && (
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold"
                      title={task.assignedTo.name}
                    >
                      {task.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <ExternalLink
                    size={14}
                    className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>

              {/* Titre de l'article */}
              <div className="pt-1 border-t border-border/30">
                <span className="text-xs text-muted-foreground line-clamp-1">
                  📄 {task.article.title}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton d'action rapide - toujours visible */}
        {onQuickComplete && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleQuickComplete}
            disabled={isCompleting || task.done}
            className={`flex-shrink-0 w-12 h-full rounded-lg flex items-center justify-center transition-all active:scale-95 ${
              task.done
                ? "bg-green-100 text-green-600 cursor-default"
                : "bg-green-500 hover:bg-green-600 text-white active:bg-green-700"
            } disabled:opacity-50`}
            title={task.done ? "Terminé" : "Marquer comme terminé"}
          >
            {isCompleting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : task.done ? (
              <CheckCircle2 size={20} />
            ) : (
              <Check size={20} />
            )}
          </motion.button>
        )}
      </div>
    </motion.li>
  );
};
