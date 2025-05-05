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
    if (e.target.files?.[0]) {
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
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 10, 95));
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
      onUploadSuccess?.();
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
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50/20"
            : "border-[color:var(--border)]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-between gap-2 bg-[color:var(--background)] px-2 py-1 rounded border">
            <div className="flex items-center gap-2 min-w-0">
              <File
                size={14}
                className="text-[color:var(--primary)] shrink-0"
              />
              <span className="text-xs truncate">{file.name}</span>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 hover:text-[color:var(--destructive)]"
              disabled={isUploading}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="py-2">
            <Upload className="h-6 w-6 mx-auto text-[color:var(--muted-foreground)] mb-1" />
            <p className="text-xs text-[color:var(--muted-foreground)] mb-1">
              Glissez un fichier ici
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-xs text-[color:var(--primary)] rounded hover:bg-[color:var(--muted)]"
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
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
              PDF, JPG, PNG, GIF (max. 10MB)
            </p>
          </div>
        )}
      </div>

      {file && (
        <>
          {isUploading && (
            <div className="w-full bg-[color:var(--muted)] rounded-full h-1.5">
              <div
                className="bg-[color:var(--primary)] h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full text-xs py-1.5"
            size="sm"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Paperclip size={14} className="mr-1.5" />
                Télécharger
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
