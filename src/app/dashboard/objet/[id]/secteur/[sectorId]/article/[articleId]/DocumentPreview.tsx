"use client";

import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  File,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileType: string;
}

interface DocumentPreviewProps {
  document: Document | null;
  onClose: () => void;
  documents?: Document[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function DocumentPreview({
  document,
  onClose,
  documents = [],
  currentIndex = 0,
  onNavigate,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const isImage = document?.fileType.startsWith("image/");
  const isPdf = document?.fileType === "application/pdf";
  const images = documents.filter((doc) => doc.fileType.startsWith("image/"));

  // Reset zoom and position when document changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [document?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") navigateToPrevious();
      if (e.key === "ArrowRight") navigateToNext();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, documents.length]);

  const navigateToPrevious = () => {
    if (currentIndex > 0 && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < documents.length - 1 && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    }
  };

  // Touch gestures for mobile
  const touchStartRef = useRef<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = { x: 0, y: 0, distance };
    } else if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / touchStartRef.current.distance;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * scale)));
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length > 0) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const threshold = 100;

    if (Math.abs(deltaX) > threshold && zoom === 1) {
      if (deltaX > 0) {
        navigateToPrevious();
      } else {
        navigateToNext();
      }
    }

    touchStartRef.current = null;
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isImage ? (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white text-sm font-medium">
                      {currentIndex + 1}/{documents.length}
                    </span>
                  </div>
                ) : isPdf ? (
                  <FileText className="w-5 h-5 text-white/80" />
                ) : (
                  <File className="w-5 h-5 text-white/80" />
                )}
                <h3 className="text-white font-medium truncate text-sm sm:text-base">
                  {document.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={document.filePath}
                  download={document.name}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-5 h-5 text-white" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Fermer (Echap)"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {isImage ? (
              <>
                {/* Navigation Arrows */}
                {documents.length > 1 && (
                  <>
                    <button
                      onClick={navigateToPrevious}
                      disabled={currentIndex === 0}
                      className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all backdrop-blur-sm"
                      title="Précédent (←)"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={navigateToNext}
                      disabled={currentIndex === documents.length - 1}
                      className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all backdrop-blur-sm"
                      title="Suivant (→)"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {/* Image Container */}
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  ref={imageRef}
                  className="relative w-full h-full flex items-center justify-center cursor-move select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="relative max-w-full max-h-full p-8">
                    <NextImage
                      src={document.filePath}
                      alt={document.name}
                      width={1920}
                      height={1080}
                      className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                      draggable={false}
                    />
                  </div>
                </motion.div>

                {/* Zoom Controls */}
                <div className="absolute bottom-24 right-4 flex flex-col gap-2 bg-black/50 rounded-full p-2 backdrop-blur-sm">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                    title="Zoom + (ou +)"
                  >
                    <ZoomIn className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={resetZoom}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Réinitialiser (0)"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                    title="Zoom - (ou -)"
                  >
                    <ZoomOut className="w-5 h-5 text-white" />
                  </button>
                </div>
              </>
            ) : isPdf ? (
              <div className="w-full h-full p-4">
                <object
                  data={document.filePath}
                  type="application/pdf"
                  className="w-full h-full rounded-lg"
                >
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <p className="mb-4">
                      Impossible d&apos;afficher le PDF dans le navigateur
                    </p>
                    <a
                      href={document.filePath}
                      download={document.name}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      Télécharger le PDF
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <File className="w-16 h-16 mb-4 opacity-50" />
                <p className="mb-4">
                  Ce type de fichier ne peut pas être prévisualisé
                </p>
                <a
                  href={document.filePath}
                  download={document.name}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Télécharger le fichier
                </a>
              </div>
            )}
          </div>

          {/* Thumbnails Bar - Only for images */}
          {isImage && images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
              <div className="p-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {images.map((img) => {
                    const imgIndex = documents.findIndex(
                      (d) => d.id === img.id
                    );
                    return (
                      <button
                        key={img.id}
                        onClick={() => onNavigate && onNavigate(imgIndex)}
                        className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all ${
                          imgIndex === currentIndex
                            ? "ring-2 ring-white scale-110"
                            : "opacity-50 hover:opacity-100"
                        }`}
                      >
                        <NextImage
                          src={img.filePath}
                          alt={img.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
