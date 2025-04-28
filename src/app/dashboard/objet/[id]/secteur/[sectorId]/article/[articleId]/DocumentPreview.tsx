"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { File, X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
}

interface DocumentPreviewProps {
  document: Document | null;
  onClose: () => void;
  documents?: Document[]; // Optional array of all documents for navigation
  currentIndex?: number; // Current index in the array
}

export default function DocumentPreview({
  document,
  onClose,
  documents = [],
  currentIndex = 0,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Déterminer si c'est une image ou un PDF
  const isImage = document?.fileType.startsWith("image/");
  const isPdf = document?.fileType === "application/pdf";

  useEffect(() => {
    if (document) {
      setLoading(true);
      setError(null);
    }
  }, [document]);

  // Navigation entre documents
  const hasMultipleDocuments = documents.length > 1;

  const navigateToPrevious = () => {
    if (!hasMultipleDocuments || currentIndex <= 0) return;
    const newIndex = (currentIndex - 1) % documents.length;
    navigateToDocument(newIndex);
  };

  const navigateToNext = () => {
    if (!hasMultipleDocuments) return;
    const newIndex = (currentIndex + 1) % documents.length;
    navigateToDocument(newIndex);
  };

  const navigateToDocument = (index: number) => {
    // Cette fonction sera implémentée au niveau du composant parent
    // qui gère l'état de l'index actuel
  };

  if (!document) return null;

  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] h-[calc(100vh-5rem)] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center">
            <File className="mr-2 h-5 w-5" />
            <span className="truncate max-w-[300px]">{document.name}</span>
          </DialogTitle>

          <div className="flex items-center gap-2">
            {/* Téléchargement direct */}
            <a
              href={document.filePath}
              download={document.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Download size={20} />
            </a>

            {/* Fermer */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        {/* Navigation */}
        {hasMultipleDocuments && (
          <div className="flex justify-between items-center px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-1" /> Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {documents.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToNext}
              disabled={currentIndex === documents.length - 1}
            >
              Suivant <ChevronRight className="ml-1" />
            </Button>
          </div>
        )}

        {/* Contenu du document */}
        <div className="flex-grow overflow-auto relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-destructive text-center p-4 bg-destructive-background rounded-md">
                <p>Impossible d'afficher ce document.</p>
                <p className="text-sm">{error}</p>
                <Button variant="outline" className="mt-2">
                  <a
                    href={document.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ouvrir dans un nouvel onglet
                  </a>
                </Button>
              </div>
            </div>
          )}

          {isImage && (
            <div className="flex items-center justify-center h-full">
              <img
                src={document.filePath}
                alt={document.name}
                className="max-w-full max-h-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError("Impossible de charger l'image");
                }}
              />
            </div>
          )}

          {isPdf && (
            <object
              data={document.filePath}
              type="application/pdf"
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Impossible de charger le PDF");
              }}
            >
              <div className="flex items-center justify-center h-full">
                <p>
                  Votre navigateur ne prend pas en charge l'affichage des PDF.
                </p>
                <a
                  href={document.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Télécharger le PDF
                </a>
              </div>
            </object>
          )}

          {!isImage && !isPdf && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <File
                  size={48}
                  className="mx-auto mb-4 text-muted-foreground"
                />
                <p>Ce type de fichier ne peut pas être prévisualisé</p>
                <Button variant="outline" className="mt-4">
                  <a
                    href={document.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Télécharger le fichier
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
