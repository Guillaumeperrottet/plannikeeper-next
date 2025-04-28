// src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/document-upload.tsx
"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";

interface DocumentUploadProps {
  taskId: string;
  onUploadSuccess?: () => void;
}

export default function DocumentUpload({
  taskId,
  onUploadSuccess,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/tasks/${taskId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du téléchargement");
      }

      toast.success("Document téléchargé avec succès");
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors du téléchargement du document"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between p-2 bg-background rounded border">
            <div className="flex items-center gap-2">
              <File size={20} className="text-blue-500" />
              <span className="text-sm truncate max-w-xs">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Glissez-déposez un fichier ici, ou
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Sélectionnez un fichier
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,image/*"
            />
            <p className="text-xs text-gray-500 mt-2">
              PDF, JPG, PNG, GIF (max. 10MB)
            </p>
          </div>
        )}
      </div>

      {file && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Téléchargement...
            </>
          ) : (
            <>
              <Paperclip size={16} className="mr-2" /> Télécharger le document
            </>
          )}
        </Button>
      )}
    </div>
  );
}
