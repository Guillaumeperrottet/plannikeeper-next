"use client";

import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { File, Trash2, FileText, Image, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface DocumentsListProps {
  taskId: string;
  onDocumentsChange?: () => void;
}

export default function DocumentsList({
  taskId,
  onDocumentsChange,
}: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ src: string; alt: string; title?: string }>
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}/documents`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }
      const data: Document[] = await response.json(); // typage explicite
      setDocuments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadDocuments();
    }
  }, [taskId, loadDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return (
        <Image
          size={18}
          className="text-[color:var(--info-foreground)]"
          aria-label="Image file"
        />
      );
    } else if (fileType === "application/pdf") {
      return (
        <FileText
          size={18}
          className="text-[color:var(--destructive-foreground)]"
          aria-label="PDF file"
        />
      );
    } else {
      return (
        <File
          size={18}
          className="text-[color:var(--muted-foreground)]"
          aria-label="Generic file"
        />
      );
    }
  };

  const handleDelete = async (documentId: string) => {
    // window.confirm pour éviter erreur SSR
    if (
      typeof window !== "undefined" &&
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du document");
      }

      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== documentId),
      );
      toast.success("Document supprimé avec succès");

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du document",
      );
    }
  };

  const openLightbox = (document: Document) => {
    const imageDocuments = documents.filter((doc) =>
      doc.fileType.startsWith("image/"),
    );
    const images = imageDocuments.map((doc) => ({
      src: doc.filePath,
      alt: doc.name,
      title: doc.name,
    }));
    const index = imageDocuments.findIndex((d) => d.id === document.id);
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  if (isLoading) {
    return (
      <div className="text-center py-3">
        <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-[color:var(--primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">
          Chargement des documents...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-3 text-[color:var(--destructive)] flex items-center justify-center gap-2">
        <AlertCircle size={14} />
        <span className="text-xs sm:text-sm">{error}</span>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-3 text-[color:var(--muted-foreground)]">
        <p className="text-xs sm:text-sm">
          Aucun document attaché à cette tâche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-document-list>
      {/* Image Gallery - Photos only */}
      {documents.filter((doc) => doc.fileType.startsWith("image/")).length >
        0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Photos (
            {
              documents.filter((doc) => doc.fileType.startsWith("image/"))
                .length
            }
            )
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {documents
              .filter((doc) => doc.fileType.startsWith("image/"))
              .map((doc) => (
                <div
                  key={doc.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border border-border hover:border-primary transition-all hover:shadow-lg"
                  onClick={() => openLightbox(doc)}
                >
                  <NextImage
                    src={doc.filePath}
                    alt={doc.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{doc.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Other Documents - PDFs and files */}
      {documents.filter((doc) => !doc.fileType.startsWith("image/")).length >
        0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Fichiers (
            {
              documents.filter((doc) => !doc.fileType.startsWith("image/"))
                .length
            }
            )
          </h4>
          <div className="space-y-2">
            {documents
              .filter((doc) => !doc.fileType.startsWith("image/"))
              .map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border shadow-sm hover:bg-muted/50 hover:border-primary transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.fileType)}
                    <div className="flex-1 min-w-0">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm font-medium hover:underline truncate cursor-pointer text-foreground"
                      >
                        {doc.name}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(doc.fileSize)} •{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Ouvrir"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lightbox pour les images */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={closeLightbox}
      />
    </div>
  );
}
