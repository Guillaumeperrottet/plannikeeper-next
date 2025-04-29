"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Paperclip, Loader2 } from "lucide-react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setUploadProgress(0);

    // Simuler une progression d'upload (pour l'UX)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 95); // Jamais 100% jusqu'à confirmation
      });
    }, 300);

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

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Document téléchargé avec succès");
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);

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
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 bg-opacity-20"
            : "border-[color:var(--border)]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between p-2 bg-[color:var(--background)] rounded border border-[color:var(--border)]">
            <div className="flex items-center gap-2 flex-1 truncate">
              <File
                size={20}
                className="text-[color:var(--primary)] flex-shrink-0"
              />
              <span className="text-sm truncate max-w-xs">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:text-[color:var(--destructive)] transition-colors"
              aria-label="Retirer le fichier"
              disabled={isUploading}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-[color:var(--muted-foreground)] mb-2" />
            <p className="text-sm text-[color:var(--muted-foreground)] mb-2">
              Glissez-déposez un fichier ici, ou
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm text-[color:var(--primary)] bg-[color:var(--primary-foreground)] rounded-lg hover:bg-[color:var(--primary)] hover:bg-opacity-10 transition-colors"
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
            <p className="text-xs text-[color:var(--muted-foreground)] mt-2">
              PDF, JPG, PNG, GIF (max. 10MB)
            </p>
          </div>
        )}
      </div>

      {file && (
        <>
          {isUploading && (
            <div className="w-full bg-[color:var(--muted)] rounded-full h-2">
              <div
                className="bg-[color:var(--primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />{" "}
                Téléchargement...
              </>
            ) : (
              <>
                <Paperclip size={16} className="mr-2" /> Télécharger le document
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
