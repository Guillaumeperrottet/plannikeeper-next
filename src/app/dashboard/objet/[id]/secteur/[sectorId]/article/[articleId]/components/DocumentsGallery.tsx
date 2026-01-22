"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface DocumentsGalleryProps {
  taskId: string;
}

export function DocumentsGallery({ taskId }: DocumentsGalleryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/${taskId}/documents`);
      if (!response.ok) throw new Error("Erreur chargement");
      const data: Document[] = await response.json();
      setDocuments(data);
    } catch {
      toast.error("Impossible de charger les documents");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadDocuments();
    }
  }, [taskId, loadDocuments]);

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm("Supprimer ce fichier ?")) return;

    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur suppression");

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Fichier supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const images = documents.filter((doc) => doc.fileType.startsWith("image/"));
  const files = documents.filter((doc) => !doc.fileType.startsWith("image/"));

  const lightboxImages = images.map((img) => ({
    src: img.filePath,
    alt: img.name,
    title: img.name,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Aucun fichier ajouté
      </div>
    );
  }

  return (
    <>
      {/* Galerie d'images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.filePath}
                  alt={img.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Overlay au hover - caché sur mobile */}
                <div className="hidden md:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(img.filePath, "_blank");
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDelete(img.id, e)}
                      disabled={deletingId === img.id}
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Nom du fichier en bas */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">{img.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des fichiers (PDF, etc.) */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Documents ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors group"
              >
                <div className="p-2 bg-muted rounded">
                  <FileText className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(file.filePath, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(file.id, e)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox pour les images */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
      />
    </>
  );
}
