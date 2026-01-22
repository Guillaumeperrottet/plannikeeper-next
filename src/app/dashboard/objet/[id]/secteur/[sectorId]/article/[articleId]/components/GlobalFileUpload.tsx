"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";

interface GlobalFileUploadProps {
  taskId: string;
  onUploadSuccess?: () => void;
  compact?: boolean;
}

export function GlobalFileUpload({
  taskId,
  onUploadSuccess,
  compact = false,
}: GlobalFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return file;
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
      };
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      return file;
    }
  };

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 95));
      }, 200);

      const formData = new FormData();
      const processedFile = await processFile(file);
      formData.append("file", processedFile);

      try {
        const response = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erreur lors du téléchargement");
        }

        clearInterval(progressInterval);
        setUploadProgress(100);
        toast.success("Fichier ajouté avec succès !");

        // Attendre un peu pour voir la progression à 100%
        setTimeout(() => {
          onUploadSuccess?.();
          setUploadProgress(0);
        }, 500);
      } catch {
        clearInterval(progressInterval);
        toast.error("Erreur lors de l'upload");
        setUploadProgress(0);
      } finally {
        setIsUploading(false);
      }
    },
    [taskId, onUploadSuccess],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    [uploadFile],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Petit bouton discret */}
      <Button
        variant="outline"
        size={compact ? "sm" : "sm"}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={compact ? "gap-1 h-7 px-2 text-xs" : "gap-2"}
      >
        {isUploading ? (
          <>
            <Loader2
              className={
                compact ? "h-3 w-3 animate-spin" : "h-4 w-4 animate-spin"
              }
            />
            {compact ? `${uploadProgress}%` : `${uploadProgress}%`}
          </>
        ) : (
          <>
            <Paperclip className={compact ? "h-3 w-3" : "h-4 w-4"} />
            {compact ? "Ajouter" : "Ajouter un fichier"}
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,image/*"
      />

      {/* Zone de drag & drop global */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="fixed inset-0 pointer-events-none z-50"
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 pointer-events-auto"
            >
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm" />
              <div className="absolute inset-4 border-4 border-dashed border-primary rounded-2xl flex items-center justify-center">
                <div className="bg-background/95 rounded-2xl p-8 shadow-2xl text-center">
                  <Upload className="h-16 w-16 mx-auto text-primary mb-4 animate-bounce" />
                  <p className="text-2xl font-bold text-foreground mb-2">
                    Déposez votre fichier ici
                  </p>
                  <p className="text-muted-foreground">
                    Images et PDF acceptés
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
