"use client";

import { useState } from "react";
import { Task } from "../../lib/types";
import { useRouter } from "next/navigation";
import {
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "../../lib/taskHelpers";
import { Card, CardHeader, CardContent } from "@/app/components/ui/card";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { motion, AnimatePresence } from "framer-motion";

interface TaskCardProps {
  task: Task;
  objetId: string;
  sectorId: string;
  articleId: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskCard({
  task,
  objetId,
  sectorId,
  articleId,
}: TaskCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleNavigate = () => {
    router.push(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${task.id}`,
    );
  };

  const imageDocuments =
    task.documents?.filter((doc) => doc.fileType.startsWith("image/")) || [];

  const otherDocuments =
    task.documents?.filter((doc) => !doc.fileType.startsWith("image/")) || [];

  const lightboxImages = imageDocuments.map((doc) => ({
    src: doc.filePath,
    alt: doc.name,
    title: doc.name,
  }));

  // Déterminer la couleur du point selon le statut
  const dotColor = task.status === "completed" ? "#22c55e" : "#ef4444";

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <h3 className="font-semibold text-base truncate">
                  {task.name}
                </h3>
                {task.recurring && (
                  <RefreshCcw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Métadonnées compactes */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {task.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{task.assignedTo.name}</span>
                  </div>
                )}
                {task.realizationDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(task.realizationDate)}</span>
                  </div>
                )}
                {(imageDocuments.length > 0 || otherDocuments.length > 0) && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{imageDocuments.length + otherDocuments.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }}
                className="p-1.5 hover:bg-muted rounded transition-colors"
                title="Ouvrir"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="h-6 w-6 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 space-y-4">
                {/* Description */}
                {task.description && (
                  <div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Photos */}
                {imageDocuments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Photos ({imageDocuments.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {imageDocuments.slice(0, 6).map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:border-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setLightboxIndex(idx);
                            setLightboxOpen(true);
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.filePath}
                            alt={img.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform pointer-events-none"
                          />
                        </div>
                      ))}
                      {imageDocuments.length > 6 && (
                        <div className="flex items-center justify-center aspect-square rounded-lg border bg-muted text-sm text-muted-foreground">
                          +{imageDocuments.length - 6} photo(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Autres documents */}
                {otherDocuments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Documents ({otherDocuments.length})
                    </h4>
                    <div className="space-y-2">
                      {otherDocuments.slice(0, 3).map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 text-sm p-2 bg-muted rounded hover:bg-muted/70 transition-colors"
                        >
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate flex-1">{doc.name}</span>
                        </a>
                      ))}
                      {otherDocuments.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          + {otherDocuments.length - 3} autre(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Lightbox pour les images */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
