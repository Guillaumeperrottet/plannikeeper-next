// src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/documents-list.tsx
"use client";

import { useState, useEffect } from "react";
import { File, Trash2, FileText, Image, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}/documents`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadDocuments();
    }
  }, [taskId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image size={20} className="text-blue-500" />;
    } else if (fileType === "application/pdf") {
      return <FileText size={20} className="text-red-500" />;
    } else {
      return <File size={20} className="text-gray-500" />;
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
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
        prevDocs.filter((doc) => doc.id !== documentId)
      );
      toast.success("Document supprimé avec succès");

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du document"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Chargement des documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600 flex items-center justify-center gap-2">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>Aucun document attaché à cette tâche</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm"
        >
          <div className="flex items-center gap-3">
            {getFileIcon(doc.fileType)}
            <div className="flex-1 min-w-0">
              <a
                href={doc.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm font-medium hover:underline truncate"
              >
                {doc.name}
              </a>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(doc.fileSize)} •
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            className="p-1 hover:text-red-600 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
