"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  height?: number | null;
}

interface SectorCanvasProps {
  sectorId: string;
  articles: Article[];
  sectorImage: string;
  canEdit: boolean;
  objectId: string;
}

export default function SectorCanvas({
  sectorId,
  articles,
  sectorImage,
  canEdit,
  objectId,
}: SectorCanvasProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [draggingArticle, setDraggingArticle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const [scaling, setScaling] = useState({ width: 0, height: 0 });
  const [isDirty, setIsDirty] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Mettre à jour les articles locaux quand les props changent
  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  // Fonction pour gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setScaling({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded]);

  // Gestion du début du glisser-déposer
  const handleDragStart = (e: React.MouseEvent, article: Article) => {
    if (!canEdit) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggingArticle(article.id);
    setDragOffset({ x: offsetX, y: offsetY });
    e.preventDefault();
  };

  // Gestion du déplacement pendant le glisser-déposer
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingArticle || !canEdit || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX =
      ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) *
      100;
    const newY =
      ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) *
      100;

    // Limiter aux bordures du conteneur
    const clampedX = Math.max(0, Math.min(100 - 8, newX)); // 8% comme largeur par défaut
    const clampedY = Math.max(0, Math.min(100 - 8, newY)); // 8% comme hauteur par défaut

    setLocalArticles((prevArticles) =>
      prevArticles.map((art) =>
        art.id === draggingArticle
          ? { ...art, positionX: clampedX, positionY: clampedY }
          : art
      )
    );
    setIsDirty(true);
  };

  // Gestion de la fin du glisser-déposer
  const handleMouseUp = () => {
    if (draggingArticle && isDirty) {
      saveArticlePositions();
    }
    setDraggingArticle(null);
  };

  // Sauvegarder les positions des articles
  const saveArticlePositions = async () => {
    if (!isDirty) return;

    try {
      const articleToUpdate = localArticles.find(
        (a) => a.id === draggingArticle
      );
      if (!articleToUpdate) return;

      const response = await fetch(
        `/api/articles/${articleToUpdate.id}/position`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: articleToUpdate.positionX,
            positionY: articleToUpdate.positionY,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde de la position");
      }

      setIsDirty(false);
      toast.success("Position mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error("Error saving article positions:", error);
    }
  };

  // Gérer le clic sur un article pour afficher les détails
  const handleArticleClick = (article: Article) => {
    if (draggingArticle) return; // Ignorer les clics pendant le glissement

    setSelectedArticle(article);
    router.push(
      `/dashboard/objet/${objectId}/secteur/${sectorId}/article/${article.id}`
    );
  };

  // Gérer le clic sur le plan pour créer un nouvel article à cet endroit
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canEdit || draggingArticle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    router.push(
      `/dashboard/objet/${objectId}/secteur/${sectorId}/article/new?x=${x}&y=${y}`
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gray-100 rounded-md overflow-hidden aspect-[16/9] shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Image du secteur */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={sectorImage}
          alt={`Plan du secteur`}
          layout="fill"
          objectFit="contain"
          className="pointer-events-none"
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Articles */}
      {localArticles.map((article) => (
        <div
          key={article.id}
          className={`absolute cursor-pointer bg-blue-100 border-2 ${
            draggingArticle === article.id
              ? "border-blue-600 z-20"
              : "border-blue-400 z-10"
          } rounded-md p-2 shadow-sm hover:shadow-md transition-shadow`}
          style={{
            left: `${article.positionX || 0}%`,
            top: `${article.positionY || 0}%`,
            width: `${article.width || 8}%`,
            height: `${article.height || 8}%`,
            minWidth: "80px",
            minHeight: "40px",
          }}
          onMouseDown={(e) => handleDragStart(e, article)}
          onClick={() => handleArticleClick(article)}
        >
          <div className="text-xs font-bold truncate">{article.title}</div>
          {article.description && (
            <div className="text-xs truncate">{article.description}</div>
          )}
        </div>
      ))}

      {canEdit && (
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 p-2 rounded-md text-xs">
          {draggingArticle
            ? "Déplacez l'article et relâchez pour enregistrer"
            : "Cliquez sur le plan pour ajouter un article"}
        </div>
      )}
    </div>
  );
}
