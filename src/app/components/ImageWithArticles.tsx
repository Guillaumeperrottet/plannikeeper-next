import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Move, Square, Edit, Trash } from "lucide-react";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

type ImageWithArticlesProps = {
  imageSrc: string;
  imageAlt: string;
  originalWidth: number;
  originalHeight: number;
  articles: Article[];
  onArticleClick?: (articleId: string) => void;
  onArticleHover?: (articleId: string | null) => void;
  hoveredArticleId?: string | null;
  selectedArticleId?: string | null;
  isEditable?: boolean;
  className?: string;
  // Nouvelles props pour les actions
  onArticleMove?: (articleId: string) => void;
  onArticleResize?: (articleId: string) => void;
  onArticleEdit?: (articleId: string) => void;
  onArticleDelete?: (articleId: string) => void;
  // Nouvelle prop pour la mise à jour des articles
  onArticleUpdate?: (articleId: string, updates: { title: string; description: string }) => Promise<void>;
  // Nouvelle prop pour la mise à jour de position
  onArticlePositionUpdate?: (articleId: string, updates: { positionX: number; positionY: number; width: number; height: number }) => Promise<void>;
};

export default function ImageWithArticles({
  imageSrc,
  imageAlt,
  originalWidth,
  originalHeight,
  articles,
  onArticleClick,
  onArticleHover,
  hoveredArticleId,
  selectedArticleId,
  isEditable = false,
  className = "",
  // Nouvelles props pour les actions
  onArticleMove,
  onArticleResize,
  onArticleEdit,
  onArticleDelete,
  // Nouvelle prop pour la mise à jour
  onArticleUpdate,
  // Nouvelle prop pour la mise à jour de position
  onArticlePositionUpdate,
}: ImageWithArticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);
  const [imageSize, setImageSize] = useState({
    displayWidth: 0,
    displayHeight: 0,
    scaleX: 1,
    scaleY: 1,
    aspectRatio: originalWidth / originalHeight,
  });

  // État pour détecter si l'utilisateur est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // État pour gérer le popover ouvert
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // États pour le modal d'édition
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // États pour le mode déplacement
  const [isDragging, setIsDragging] = useState(false);
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Détecter si l'appareil est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fonction pour mettre à jour les dimensions
  const updateDimensions = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const image = imageRef.current;
    const rect = image.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const originalAspectRatio = originalWidth / originalHeight;
    const displayAspectRatio = displayWidth / displayHeight;

    // Déterminer comment l'image est contrainte (par largeur ou hauteur)
    let effectiveWidth, effectiveHeight;

    if (displayAspectRatio > originalAspectRatio) {
      // L'image est contrainte par la hauteur
      effectiveHeight = displayHeight;
      effectiveWidth = effectiveHeight * originalAspectRatio;
    } else {
      // L'image est contrainte par la largeur
      effectiveWidth = displayWidth;
      effectiveHeight = effectiveWidth / originalAspectRatio;
    }

    // Calculer les facteurs d'échelle pour transformer les coordonnées
    const scaleX = originalWidth / effectiveWidth;
    const scaleY = originalHeight / effectiveHeight;

    setImageSize({
      displayWidth: effectiveWidth,
      displayHeight: effectiveHeight,
      scaleX,
      scaleY,
      aspectRatio: originalAspectRatio,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("Image dimensions updated:", {
        display: { width: displayWidth, height: displayHeight },
        effective: { width: effectiveWidth, height: effectiveHeight },
        original: { width: originalWidth, height: originalHeight },
        scales: { x: scaleX, y: scaleY },
      });
    }
  }, [originalWidth, originalHeight]);

  // Gérer le redimensionnement et le montage initial
  useEffect(() => {
    setMounted(true);

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleImageLoad = () => {
      updateDimensions();
    };

    const timers = [
      setTimeout(() => updateDimensions(), 100),
      setTimeout(() => updateDimensions(), 500),
      setTimeout(() => updateDimensions(), 1000),
    ];

    const currentImageRef = imageRef.current;

    if (currentImageRef) {
      currentImageRef.addEventListener("load", handleImageLoad);

      // Si l'image est déjà chargée (depuis le cache), exécuter updateDimensions
      if (currentImageRef.complete) {
        updateDimensions();
      }
    }

    // Mise à jour lors du redimensionnement de la fenêtre
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (currentImageRef) {
        currentImageRef.removeEventListener("load", handleImageLoad);
      }
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions]);

  // Effectuer une mise à jour supplémentaire si la source de l'image change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      // Mise à jour immédiate
      updateDimensions();

      // Mises à jour différées pour s'assurer que le navigateur a bien terminé le rendu
      const timer1 = setTimeout(() => {
        updateDimensions();
      }, 50);

      const timer2 = setTimeout(() => {
        updateDimensions();
      }, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [imageSrc, updateDimensions]);

  // Calculer la position et les dimensions d'un article
  const calculateArticleStyle = useCallback(
    (article: Article) => {
      if (!article.positionX || !article.positionY) {
        return {};
      }

      // Si cet article est en cours de déplacement, utiliser la position temporaire
      if (isDragging && draggingArticleId === article.id && tempDragPosition) {
        const width = ((article.width || 20) / 100) * imageSize.displayWidth;
        const height = ((article.height || 20) / 100) * imageSize.displayHeight;

        return {
          left: `${tempDragPosition.x}px`,
          top: `${tempDragPosition.y}px`,
          width: `${width}px`,
          height: `${height}px`,
          transform: "translate(-50%, -50%)",
        };
      }

      // Espace potentiellement non utilisé à cause du maintien du ratio d'aspect
      const unusedWidth = containerRef.current?.clientWidth
        ? containerRef.current.clientWidth - imageSize.displayWidth
        : 0;
      const unusedHeight = containerRef.current?.clientHeight
        ? containerRef.current.clientHeight - imageSize.displayHeight
        : 0;

      // Compensation pour centrer l'image dans son conteneur
      const offsetX = unusedWidth / 2;
      const offsetY = unusedHeight / 2;

      // Convertir les pourcentages en pixels dans le système de coordonnées de l'image
      const xPos = (article.positionX / 100) * imageSize.displayWidth + offsetX;
      const yPos =
        (article.positionY / 100) * imageSize.displayHeight + offsetY;
      const width = ((article.width || 20) / 100) * imageSize.displayWidth;
      const height = ((article.height || 20) / 100) * imageSize.displayHeight;

      return {
        left: `${xPos}px`,
        top: `${yPos}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: "translate(-50%, -50%)",
      };
    },
    [imageSize, isDragging, draggingArticleId, tempDragPosition]
  );

  // Fonctions utilitaires pour le drag & drop
  const pixelsToPercent = useCallback((position: { x: number; y: number; width: number; height: number }) => {
    // Calculer les décalages pour centrer l'image
    const unusedWidth = containerRef.current?.clientWidth
      ? containerRef.current.clientWidth - imageSize.displayWidth
      : 0;
    const unusedHeight = containerRef.current?.clientHeight
      ? containerRef.current.clientHeight - imageSize.displayHeight
      : 0;
    const offsetX = unusedWidth / 2;
    const offsetY = unusedHeight / 2;

    // Convertir les coordonnées pixels en pourcentages
    const percentX = ((position.x - offsetX) / imageSize.displayWidth) * 100;
    const percentY = ((position.y - offsetY) / imageSize.displayHeight) * 100;

    return {
      positionX: percentX,
      positionY: percentY,
    };
  }, [imageSize]);

  const handleDragStart = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setDragMode(true);
    setDraggingArticleId(article.id);
    setIsDragging(true);
    setOpenPopoverId(null); // Fermer le popover

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const articleStyle = calculateArticleStyle(article);
    
    // Calculer l'offset du clic par rapport au centre de l'article
    const articleCenterX = parseFloat(articleStyle.left?.toString() || '0');
    const articleCenterY = parseFloat(articleStyle.top?.toString() || '0');
    
    setDragOffset({
      x: x - articleCenterX,
      y: y - articleCenterY,
    });
  };

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !draggingArticleId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Calculer la nouvelle position en tenant compte de l'offset
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    // Mettre à jour la position temporaire pour l'affichage en temps réel
    setTempDragPosition({ x: newX, y: newY });
  }, [isDragging, draggingArticleId, dragOffset]);

  const handleDragEnd = useCallback(async (clientX: number, clientY: number) => {
    if (!isDragging || !draggingArticleId || !onArticlePositionUpdate || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const article = articles.find(a => a.id === draggingArticleId);
    if (!article) return;

    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    const percentPosition = pixelsToPercent({
      x: newX,
      y: newY,
      width: ((article.width || 20) / 100) * imageSize.displayWidth,
      height: ((article.height || 20) / 100) * imageSize.displayHeight,
    });

    const constrainedX = Math.max(0, Math.min(100, percentPosition.positionX));
    const constrainedY = Math.max(0, Math.min(100, percentPosition.positionY));

    try {
      // Sauvegarder la nouvelle position
      await onArticlePositionUpdate(draggingArticleId, {
        positionX: constrainedX,
        positionY: constrainedY,
        width: article.width || 20,
        height: article.height || 20,
      });
    } catch (error) {
      console.error("Erreur lors du déplacement de l'article:", error);
    } finally {
      // Réinitialiser les états
      setIsDragging(false);
      setDraggingArticleId(null);
      setDragMode(false);
      setDragOffset({ x: 0, y: 0 });
      setTempDragPosition(null);
    }
  }, [isDragging, draggingArticleId, dragOffset, articles, imageSize, onArticlePositionUpdate, pixelsToPercent]);

  // Gérer le clic/toucher sur un article
  const handleArticleInteraction = (
    e: React.MouseEvent | React.TouchEvent,
    article: Article
  ) => {
    e.stopPropagation(); // Empêcher la propagation aux éléments parents

    // Sur mobile ou si les actions sont disponibles, ouvrir le popover
    if (
      isMobile ||
      onArticleMove ||
      onArticleResize ||
      onArticleEdit ||
      onArticleDelete
    ) {
      // Ouvrir le popover pour cet article
      setOpenPopoverId(article.id);
      if (onArticleHover) onArticleHover(article.id);
      return;
    }

    // Sur desktop sans actions, comportement de clic standard
    if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  // Gérer le survol d'un article (uniquement sur desktop)
  const handleArticleMouseEnter = (e: React.MouseEvent, article: Article) => {
    if (isMobile) return;
    if (onArticleHover) onArticleHover(article.id);
  };

  const handleArticleMouseLeave = () => {
    if (isMobile) return;
    if (onArticleHover) onArticleHover(null);
  };

  // Fonctions pour gérer l'édition d'articles
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      description: article.description || "",
    });
    setEditModalOpen(true);
    setOpenPopoverId(null); // Fermer le popover
  };

  const handleSaveEdit = async () => {
    if (!editingArticle || !onArticleUpdate) return;

    setIsLoading(true);
    try {
      await onArticleUpdate(editingArticle.id, editForm);
      setEditModalOpen(false);
      setEditingArticle(null);
      setEditForm({ title: "", description: "" });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article:", error);
      // TODO: Afficher un toast d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingArticle(null);
    setEditForm({ title: "", description: "" });
  };

  // Fermer le popover quand on clique ailleurs
  const handleBackgroundClick = () => {
    setOpenPopoverId(null);
    if (onArticleHover) onArticleHover(null);
  };

  // Gestion des événements de zoom pour fermer le popover
  useEffect(() => {
    const handleZoomChange = () => {
      setOpenPopoverId(null);
      if (onArticleHover) onArticleHover(null);
    };

    window.addEventListener("resize", handleZoomChange);

    // Gestion des gestes de pinch sur iOS Safari
    let lastTouchDistance = 0;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const touchDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );

        if (
          lastTouchDistance &&
          Math.abs(touchDistance - lastTouchDistance) > 10
        ) {
          setOpenPopoverId(null);
          if (onArticleHover) onArticleHover(null);
        }

        lastTouchDistance = touchDistance;
      }
    };

    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("resize", handleZoomChange);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onArticleHover]);

  // Gestion globale des événements de drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        handleDragEnd(e.clientX, e.clientY);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragMode) {
        setDragMode(false);
        setIsDragging(false);
        setDraggingArticleId(null);
        setTempDragPosition(null);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDragging, handleDragMove, handleDragEnd, dragMode]);

  // Ne rien afficher pendant le premier rendu côté client
  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: "100%", position: "relative" }}
      onClick={handleBackgroundClick}
    >
      {/* Indicateur du mode déplacement */}
      {dragMode && (
        <div className="absolute top-2 left-2 z-30 bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode déplacement actif - Cliquez et glissez les articles
          <button
            onClick={() => setDragMode(false)}
            className="ml-2 text-blue-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <Image
        ref={imageRef as React.Ref<HTMLImageElement>}
        src={imageSrc}
        alt={imageAlt}
        width={originalWidth}
        height={originalHeight}
        className="block h-auto max-h-[calc(100vh-150px)]"
        style={{ objectFit: "contain" }}
        onLoadingComplete={updateDimensions}
        priority
      />

      {articles.map((article: Article) => {
        if (!article.positionX || !article.positionY) return null;

        const articleStyle = calculateArticleStyle(article);
        const isActive =
          hoveredArticleId === article.id ||
          selectedArticleId === article.id ||
          openPopoverId === article.id;

        // Si les actions sont disponibles, utiliser le popover
        if (
          onArticleMove ||
          onArticleResize ||
          onArticleEdit ||
          onArticleDelete
        ) {
          return (
            <Popover
              key={article.id}
              open={openPopoverId === article.id}
              onOpenChange={(open) => {
                if (open) {
                  setOpenPopoverId(article.id);
                  if (onArticleHover) onArticleHover(article.id);
                } else {
                  setOpenPopoverId(null);
                  if (onArticleHover) onArticleHover(null);
                }
              }}
            >
              {/* @ts-expect-error - Types issue with shadcn/ui PopoverTrigger children prop */}
              <PopoverTrigger asChild>
                <div
                  className={`absolute border ${
                    isActive ? "border-blue-500" : "border-white"
                  } rounded-md shadow-md overflow-hidden ${
                    dragMode ? "cursor-move hover:border-blue-400" : "cursor-pointer"
                  } pointer-events-auto ${
                    isEditable ? "z-10" : ""
                  } ${isDragging && draggingArticleId === article.id ? "opacity-75 z-20" : ""}`}
                  style={{
                    ...articleStyle,
                    zIndex: isDragging && draggingArticleId === article.id ? 20 : (isActive ? 10 : 5),
                    backgroundColor: dragMode ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 0, 0, 0.2)",
                  }}
                  onClick={(e: React.MouseEvent) => {
                    if (dragMode) {
                      e.stopPropagation();
                      return; // En mode déplacement, ne pas ouvrir le popover au clic
                    }
                    handleArticleInteraction(e, article);
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    if (dragMode && onArticlePositionUpdate) {
                      handleDragStart(e, article);
                    }
                  }}
                  onMouseEnter={(e: React.MouseEvent) => handleArticleMouseEnter(e, article)}
                  onMouseLeave={handleArticleMouseLeave}
                >
                  {/* Zone cliquable/survolable pour chaque article positionné */}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="center">
                <div className="space-y-4">
                  {/* En-tête avec titre et description */}
                  <div>
                    <h4 className="font-medium leading-none">
                      {article.title}
                    </h4>
                    {article.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {article.description}
                      </p>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    {onArticleMove && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onArticlePositionUpdate) {
                            // Activer le mode déplacement intégré
                            setDragMode(true);
                            setOpenPopoverId(null);
                          } else {
                            // Fallback vers la fonction externe (redirection)
                            onArticleMove(article.id);
                            setOpenPopoverId(null);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Move size={16} />
                        {dragMode ? "Mode déplacement actif" : "Déplacer"}
                      </Button>
                    )}

                    {onArticleResize && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleResize(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Square size={16} />
                        Redimensionner
                      </Button>
                    )}

                    {onArticleEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onArticleUpdate) {
                            // Utiliser le modal d'édition intégré
                            handleEditArticle(article);
                          } else {
                            // Fallback vers la fonction externe (redirection)
                            onArticleEdit(article.id);
                            setOpenPopoverId(null);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Modifier
                      </Button>
                    )}

                    {onArticleDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onArticleDelete(article.id);
                          setOpenPopoverId(null);
                        }}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash size={16} />
                        Supprimer
                      </Button>
                    )}
                  </div>

                  {/* Bouton pour voir/gérer les tâches si pas d'actions spécifiques */}
                  {onArticleClick && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        onArticleClick(article.id);
                        setOpenPopoverId(null);
                      }}
                    >
                      Gérer les tâches
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        // Rendu simple sans popover si pas d'actions
        return (
          <div
            key={article.id}
            className={`absolute border ${
              isActive ? "border-blue-500" : "border-white"
            } rounded-md shadow-md overflow-hidden cursor-pointer pointer-events-auto ${
              isEditable ? "z-10" : ""
            }`}
            style={{
              ...articleStyle,
              zIndex: isActive ? 10 : 5,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => handleArticleInteraction(e, article)}
            onMouseEnter={(e) => handleArticleMouseEnter(e, article)}
            onMouseLeave={handleArticleMouseLeave}
          >
            {/* Zone cliquable/survolable pour chaque article positionné */}
          </div>
        );
      })}

      {/* Modal d'édition */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              {/* @ts-expect-error - Types issue with shadcn/ui Label children prop */}
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Titre de l'article"
              />
            </div>
            <div>
              {/* @ts-expect-error - Types issue with shadcn/ui Label children prop */}
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Description de l'article (optionnelle)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
