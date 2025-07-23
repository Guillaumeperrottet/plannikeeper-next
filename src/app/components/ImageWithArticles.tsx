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
  onArticleDelete?: (articleId: string) => Promise<void>; // Changé pour retourner une Promise
  // Nouvelle prop pour la mise à jour des articles
  onArticleUpdate?: (articleId: string, updates: { title: string; description: string }) => Promise<void>;
  // Nouvelle prop pour la mise à jour de position
  onArticlePositionUpdate?: (articleId: string, updates: { positionX: number; positionY: number; width: number; height: number }) => Promise<void>;
  // Nouvelle prop pour créer un article
  onArticleCreate?: (articleData: { title: string; description: string; positionX: number; positionY: number; width: number; height: number }) => Promise<void>;
  // Nouvelle prop pour activer le mode création depuis l'extérieur
  createMode?: boolean;
  onCreateModeChange?: (createMode: boolean) => void;
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
  // Nouvelle prop pour créer un article
  onArticleCreate,
  // Nouvelles props pour le mode création
  createMode: externalCreateMode,
  onCreateModeChange,
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

  // États pour le modal de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le modal de création d'article
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    positionX: 50,
    positionY: 50,
    width: 20,
    height: 15,
  });
  const [isCreating, setIsCreating] = useState(false);

  // États pour le mode création interactive
  const [createMode, setCreateMode] = useState(false);
  const [isDrawingNew, setIsDrawingNew] = useState(false);
  const [newArticleStart, setNewArticleStart] = useState({ x: 0, y: 0 });
  const [newArticleEnd, setNewArticleEnd] = useState({ x: 0, y: 0 });
  const [newArticleSize, setNewArticleSize] = useState({ width: 0, height: 0 });

  // Synchroniser le mode création avec la prop externe
  useEffect(() => {
    if (externalCreateMode !== undefined && createMode !== externalCreateMode) {
      setCreateMode(externalCreateMode);
      if (!externalCreateMode) {
        // Réinitialiser les états de dessin quand on sort du mode création
        setIsDrawingNew(false);
        setNewArticleStart({ x: 0, y: 0 });
        setNewArticleEnd({ x: 0, y: 0 });
        setNewArticleSize({ width: 0, height: 0 });
      }
    }
  }, [externalCreateMode, createMode]);

  // Notifier le changement de mode création
  const updateCreateMode = useCallback((newMode: boolean) => {
    setCreateMode(newMode);
    if (onCreateModeChange) {
      onCreateModeChange(newMode);
    }
  }, [onCreateModeChange]);

  // États pour le mode déplacement
  const [isDragging, setIsDragging] = useState(false);
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState(false);
  const [tempDragPosition, setTempDragPosition] = useState<{ x: number; y: number } | null>(null);

  // États pour le redimensionnement
  const [isResizing, setIsResizing] = useState(false);
  const [resizingArticleId, setResizingArticleId] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'se', 'sw', 'ne', 'nw'
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [tempResizeSize, setTempResizeSize] = useState<{ width: number; height: number; x: number; y: number } | null>(null);

  // État pour empêcher l'ouverture du popover après une action
  const [preventPopoverOpen, setPreventPopoverOpen] = useState(false);

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

      // Si cet article est en cours de redimensionnement, utiliser les dimensions temporaires
      if (isResizing && resizingArticleId === article.id && tempResizeSize) {
        return {
          left: `${tempResizeSize.x}px`,
          top: `${tempResizeSize.y}px`,
          width: `${tempResizeSize.width}px`,
          height: `${tempResizeSize.height}px`,
          transform: "translate(-50%, -50%)",
        };
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
    [imageSize, isDragging, draggingArticleId, tempDragPosition, isResizing, resizingArticleId, tempResizeSize]
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

  // Fonction pour vérifier si un point est dans les limites de l'image
  const isInImageBounds = useCallback((x: number, y: number) => {
    if (!imageSize.displayWidth || !imageSize.displayHeight) return false;

    // Calculer les décalages pour centrer l'image
    const unusedWidth = containerRef.current?.clientWidth
      ? containerRef.current.clientWidth - imageSize.displayWidth
      : 0;
    const unusedHeight = containerRef.current?.clientHeight
      ? containerRef.current.clientHeight - imageSize.displayHeight
      : 0;
    const offsetX = unusedWidth / 2;
    const offsetY = unusedHeight / 2;

    // Vérifier si le point (x, y) est à l'intérieur de l'image (en tenant compte du décalage)
    const imageLeft = offsetX;
    const imageRight = offsetX + imageSize.displayWidth;
    const imageTop = offsetY;
    const imageBottom = offsetY + imageSize.displayHeight;

    return (
      x >= imageLeft && x <= imageRight && y >= imageTop && y <= imageBottom
    );
  }, [imageSize]);

  const handleDragStart = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setDragMode(true);
    setDraggingArticleId(article.id);
    setIsDragging(true);
    setOpenPopoverId(null); // Fermer le popover
    setPreventPopoverOpen(true); // Empêcher l'ouverture du popover

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
    } catch {
      // TODO: Afficher un toast d'erreur
    } finally {
      // Réinitialiser les états
      setIsDragging(false);
      setDraggingArticleId(null);
      setDragMode(false);
      setDragOffset({ x: 0, y: 0 });
      setTempDragPosition(null);
      
      // Empêcher l'ouverture du popover pendant un court moment
      setTimeout(() => setPreventPopoverOpen(false), 100);
    }
  }, [isDragging, draggingArticleId, dragOffset, articles, imageSize, onArticlePositionUpdate, pixelsToPercent]);

  // Fonctions pour le redimensionnement
  const handleResizeStart = (e: React.MouseEvent, article: Article, handle: string) => {
    e.stopPropagation();
    setResizeMode(true);
    setResizingArticleId(article.id);
    setIsResizing(true);
    setResizeHandle(handle);
    setOpenPopoverId(null);
    setPreventPopoverOpen(true); // Empêcher l'ouverture du popover

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setResizeStartPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleResizeMove = useCallback((clientX: number, clientY: number) => {
    if (!isResizing || !resizingArticleId || !containerRef.current || !resizeHandle) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    const article = articles.find(a => a.id === resizingArticleId);
    if (!article) return;

    // Calculer les décalages pour centrer l'image
    const unusedWidth = containerRef.current?.clientWidth
      ? containerRef.current.clientWidth - imageSize.displayWidth
      : 0;
    const unusedHeight = containerRef.current?.clientHeight
      ? containerRef.current.clientHeight - imageSize.displayHeight
      : 0;
    const offsetX = unusedWidth / 2;
    const offsetY = unusedHeight / 2;

    // Position actuelle de l'article en pixels dans l'image
    const currentCenterX = (article.positionX! / 100) * imageSize.displayWidth + offsetX;
    const currentCenterY = (article.positionY! / 100) * imageSize.displayHeight + offsetY;
    const currentWidth = ((article.width || 20) / 100) * imageSize.displayWidth;
    const currentHeight = ((article.height || 20) / 100) * imageSize.displayHeight;

    // Position actuelle des coins
    const currentLeft = currentCenterX - currentWidth / 2;
    const currentTop = currentCenterY - currentHeight / 2;
    const currentRight = currentCenterX + currentWidth / 2;
    const currentBottom = currentCenterY + currentHeight / 2;

    // Calculer les nouvelles dimensions selon la poignée utilisée
    let newLeft = currentLeft;
    let newTop = currentTop;
    let newRight = currentRight;
    let newBottom = currentBottom;

    const deltaX = currentX - resizeStartPosition.x;
    const deltaY = currentY - resizeStartPosition.y;

    switch (resizeHandle) {
      case 'se': // Sud-Est (coin bas-droite)
        newRight = Math.max(currentLeft + 50, currentRight + deltaX);
        newBottom = Math.max(currentTop + 30, currentBottom + deltaY);
        break;
      case 'sw': // Sud-Ouest (coin bas-gauche)
        newLeft = Math.min(currentRight - 50, currentLeft + deltaX);
        newBottom = Math.max(currentTop + 30, currentBottom + deltaY);
        break;
      case 'ne': // Nord-Est (coin haut-droite)
        newRight = Math.max(currentLeft + 50, currentRight + deltaX);
        newTop = Math.min(currentBottom - 30, currentTop + deltaY);
        break;
      case 'nw': // Nord-Ouest (coin haut-gauche)
        newLeft = Math.min(currentRight - 50, currentLeft + deltaX);
        newTop = Math.min(currentBottom - 30, currentTop + deltaY);
        break;
    }

    // Calculer les nouvelles dimensions et position du centre
    const newWidth = newRight - newLeft;
    const newHeight = newBottom - newTop;
    const newCenterX = newLeft + newWidth / 2;
    const newCenterY = newTop + newHeight / 2;

    // Mettre à jour la position temporaire
    setTempResizeSize({ 
      width: newWidth, 
      height: newHeight, 
      x: newCenterX, 
      y: newCenterY 
    });
  }, [isResizing, resizingArticleId, resizeHandle, resizeStartPosition, articles, imageSize]);

  const handleResizeEnd = useCallback(async () => {
    if (!isResizing || !resizingArticleId || !onArticlePositionUpdate || !tempResizeSize) return;

    const article = articles.find(a => a.id === resizingArticleId);
    if (!article) return;

    // Calculer les décalages pour centrer l'image
    const unusedWidth = containerRef.current?.clientWidth
      ? containerRef.current.clientWidth - imageSize.displayWidth
      : 0;
    const unusedHeight = containerRef.current?.clientHeight
      ? containerRef.current.clientHeight - imageSize.displayHeight
      : 0;
    const offsetX = unusedWidth / 2;
    const offsetY = unusedHeight / 2;

    // Convertir les nouvelles dimensions en pourcentages
    const newWidthPercent = (tempResizeSize.width / imageSize.displayWidth) * 100;
    const newHeightPercent = (tempResizeSize.height / imageSize.displayHeight) * 100;

    // Convertir la nouvelle position du centre en pourcentages
    const newPositionXPercent = ((tempResizeSize.x - offsetX) / imageSize.displayWidth) * 100;
    const newPositionYPercent = ((tempResizeSize.y - offsetY) / imageSize.displayHeight) * 100;

    // Limiter les valeurs
    const constrainedWidth = Math.max(5, Math.min(50, newWidthPercent));
    const constrainedHeight = Math.max(3, Math.min(30, newHeightPercent));
    const constrainedX = Math.max(5, Math.min(95, newPositionXPercent));
    const constrainedY = Math.max(5, Math.min(95, newPositionYPercent));

    try {
      await onArticlePositionUpdate(resizingArticleId, {
        positionX: constrainedX,
        positionY: constrainedY,
        width: constrainedWidth,
        height: constrainedHeight,
      });
    } catch {
      // TODO: Afficher un toast d'erreur
    } finally {
      // Réinitialiser les états
      setIsResizing(false);
      setResizingArticleId(null);
      setResizeMode(false);
      setResizeHandle(null);
      setTempResizeSize(null);
      setResizeStartPosition({ x: 0, y: 0 });
      
      // Empêcher l'ouverture du popover pendant un court moment
      setTimeout(() => setPreventPopoverOpen(false), 100);
    }
  }, [isResizing, resizingArticleId, tempResizeSize, articles, imageSize, onArticlePositionUpdate]);









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
    } catch {
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

  // Fonctions pour gérer la suppression d'articles
  const handleDeleteArticle = (article: Article) => {
    setDeletingArticle(article);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
    setOpenPopoverId(null); // Fermer le popover
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle || !onArticleDelete) return;

    // Vérifier que le nom saisi correspond exactement au titre de l'article
    if (deleteConfirmText.trim() !== deletingArticle.title.trim()) {
      return; // Ne pas procéder à la suppression si le nom ne correspond pas
    }

    setIsDeleting(true);
    try {
      await onArticleDelete(deletingArticle.id);
      setDeleteModalOpen(false);
      setDeletingArticle(null);
      setDeleteConfirmText("");
    } catch {
      // TODO: Afficher un toast d'erreur
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setDeletingArticle(null);
    setDeleteConfirmText("");
  };

  const openCreateModal = useCallback((positionX: number, positionY: number, width: number, height: number) => {
    setCreateForm({
      title: "",
      description: "",
      positionX,
      positionY,
      width,
      height,
    });
    setCreateModalOpen(true);
    updateCreateMode(false); // Sortir du mode création
  }, [updateCreateMode]);

  const handleSaveCreate = async () => {
    if (!createForm.title.trim()) {
      return; // Ne pas procéder si le titre est vide
    }

    if (!onArticleCreate) return;

    setIsCreating(true);
    try {
      await onArticleCreate(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        positionX: 50,
        positionY: 50,
        width: 20,
        height: 15,
      });
    } catch {
      // TODO: Afficher un toast d'erreur
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setCreateModalOpen(false);
    setCreateForm({
      title: "",
      description: "",
      positionX: 50,
      positionY: 50,
      width: 20,
      height: 15,
    });
  };

  // Fermer le popover quand on clique ailleurs
  const handleBackgroundClick = () => {
    setOpenPopoverId(null);
    if (onArticleHover) onArticleHover(null);
  };

  // Gérer le début du dessin (mousedown)
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // Si on est en mode création
    if (createMode && !isDrawingNew && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Vérifier si le clic est dans les limites de l'image
      if (!isInImageBounds(x, y)) return;

      e.preventDefault();
      e.stopPropagation();
      
      setNewArticleStart({ x, y });
      setNewArticleEnd({ x, y });
      setNewArticleSize({ width: 0, height: 0 });
      setIsDrawingNew(true);
      return;
    }
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

  // Gestion globale des événements de drag et resize
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY);
      } else if (isResizing) {
        handleResizeMove(e.clientX, e.clientY);
      } else if (isDrawingNew && containerRef.current) {
        // Gestion du dessin de nouvel article
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Mettre à jour la position de fin
        setNewArticleEnd({ x: currentX, y: currentY });

        // Calculer la taille du rectangle en cours de dessin
        const width = Math.abs(currentX - newArticleStart.x);
        const height = Math.abs(currentY - newArticleStart.y);

        setNewArticleSize({ width, height });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        handleDragEnd(e.clientX, e.clientY);
      } else if (isResizing) {
        handleResizeEnd();
      } else if (isDrawingNew && containerRef.current) {
        // Terminer le dessin de nouvel article  
        const rect = containerRef.current.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const width = Math.abs(endX - newArticleStart.x);
        const height = Math.abs(endY - newArticleStart.y);

        // Vérifier que le rectangle a une taille minimale
        if (width > 15 && height > 10) {
          // Calculer la position du centre du rectangle
          const centerX = (Math.min(newArticleStart.x, endX) + width / 2);
          const centerY = (Math.min(newArticleStart.y, endY) + height / 2);

          // Calculer les décalages pour centrer l'image
          const unusedWidth = containerRef.current?.clientWidth
            ? containerRef.current.clientWidth - imageSize.displayWidth
            : 0;
          const unusedHeight = containerRef.current?.clientHeight
            ? containerRef.current.clientHeight - imageSize.displayHeight
            : 0;
          const offsetX = unusedWidth / 2;
          const offsetY = unusedHeight / 2;

          // Convertir en pourcentages
          const positionXPercent = ((centerX - offsetX) / imageSize.displayWidth) * 100;
          const positionYPercent = ((centerY - offsetY) / imageSize.displayHeight) * 100;
          const widthPercent = (width / imageSize.displayWidth) * 100;
          const heightPercent = (height / imageSize.displayHeight) * 100;

          // Limiter les valeurs
          const constrainedX = Math.max(5, Math.min(95, positionXPercent));
          const constrainedY = Math.max(5, Math.min(95, positionYPercent));
          const constrainedWidth = Math.max(5, Math.min(50, widthPercent));
          const constrainedHeight = Math.max(3, Math.min(30, heightPercent));

          // Ouvrir le modal avec les dimensions calculées
          openCreateModal(constrainedX, constrainedY, constrainedWidth, constrainedHeight);
        }

        // Réinitialiser les états de dessin
        setIsDrawingNew(false);
        setNewArticleStart({ x: 0, y: 0 });
        setNewArticleEnd({ x: 0, y: 0 });
        setNewArticleSize({ width: 0, height: 0 });
      }
    };

    // Gestion de la perte de focus ou de la sortie de la fenêtre
    const handleMouseLeave = () => {
      if (isDragging) {
        // Arrêter immédiatement le drag sans sauvegarder
        setIsDragging(false);
        setDraggingArticleId(null);
        setTempDragPosition(null);
        setTimeout(() => setPreventPopoverOpen(false), 100);
      }
      if (isResizing) {
        // Arrêter immédiatement le resize sans sauvegarder
        setIsResizing(false);
        setResizingArticleId(null);
        setTempResizeSize(null);
        setTimeout(() => setPreventPopoverOpen(false), 100);
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (createMode) {
          updateCreateMode(false);
          setIsDrawingNew(false);
          setNewArticleStart({ x: 0, y: 0 });
          setNewArticleEnd({ x: 0, y: 0 });
          setNewArticleSize({ width: 0, height: 0 });
        }
        if (dragMode) {
          setDragMode(false);
          setIsDragging(false);
          setDraggingArticleId(null);
          setTempDragPosition(null);
          setPreventPopoverOpen(false);
        }
        if (resizeMode) {
          setResizeMode(false);
          setIsResizing(false);
          setResizingArticleId(null);
          setTempResizeSize(null);
          setPreventPopoverOpen(false);
        }
      }
    };

    if (isDragging || isResizing || isDrawingNew) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('blur', handleMouseLeave); // Perte de focus de la fenêtre
    }

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDragging, isResizing, isDrawingNew, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd, dragMode, resizeMode, createMode, newArticleStart, imageSize, openCreateModal, updateCreateMode]);

  // Ne rien afficher pendant le premier rendu côté client
  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} ${createMode ? 'cursor-crosshair' : ''}`}
      style={{ 
        width: "100%", 
        position: "relative"
      } as React.CSSProperties & { '--tooltip-delay': string }}
      onMouseDown={handleBackgroundMouseDown}
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

      {/* Indicateur du mode redimensionnement */}
      {resizeMode && (
        <div className="absolute top-2 left-2 z-30 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode redimensionnement actif - Utilisez les poignées aux coins
          <button
            onClick={() => setResizeMode(false)}
            className="ml-2 text-green-200 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Indicateur du mode création */}
      {createMode && (
        <div className="absolute top-2 left-2 z-30 bg-purple-500 text-white px-3 py-1 rounded-md text-sm font-medium">
          Mode création actif - Cliquez et glissez pour dessiner un article
          <button
            onClick={() => {
              updateCreateMode(false);
              setIsDrawingNew(false);
              setNewArticleStart({ x: 0, y: 0 });
              setNewArticleEnd({ x: 0, y: 0 });
              setNewArticleSize({ width: 0, height: 0 });
            }}
            className="ml-2 text-purple-200 hover:text-white"
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
              <PopoverTrigger {...({ asChild: true } as React.ComponentProps<typeof PopoverTrigger>)}>
                <div
                  className={`absolute border ${
                    isActive ? "border-blue-500" : "border-white"
                  } rounded-md shadow-md overflow-hidden ${
                    dragMode ? "cursor-move hover:border-blue-400" : 
                    resizeMode ? "cursor-pointer hover:border-green-400" : "cursor-pointer"
                  } pointer-events-auto ${
                    isEditable ? "z-10" : ""
                  } ${isDragging && draggingArticleId === article.id ? "opacity-75 z-20" : ""} ${
                    isResizing && resizingArticleId === article.id ? "opacity-75 z-20" : ""
                  } fast-tooltip`}
                  style={{
                    ...articleStyle,
                    zIndex: (isDragging && draggingArticleId === article.id) || (isResizing && resizingArticleId === article.id) ? 20 : (isActive ? 10 : 5),
                    backgroundColor: dragMode ? "rgba(59, 130, 246, 0.3)" : 
                                   resizeMode ? "rgba(34, 197, 94, 0.3)" : "rgba(0, 0, 0, 0.2)",
                  }}
                  onClick={(e: React.MouseEvent) => {
                    if (createMode) {
                      e.stopPropagation();
                      return; // En mode création, ne pas interagir avec les articles existants
                    }
                    if (dragMode || resizeMode) {
                      e.stopPropagation();
                      return; // En mode déplacement ou redimensionnement, ne pas ouvrir le popover au clic
                    }
                    if (preventPopoverOpen) {
                      e.stopPropagation();
                      return; // Empêcher l'ouverture du popover juste après une action
                    }
                    handleArticleInteraction(e, article);
                  }}
                  onMouseDown={(e: React.MouseEvent) => {
                    if (createMode) {
                      e.stopPropagation();
                      return; // En mode création, ne pas permettre le drag/resize
                    }
                    if (dragMode && onArticlePositionUpdate && !resizeMode) {
                      // Ne déclencher le drag que si on n'est pas en train de redimensionner
                      const target = e.target as HTMLElement;
                      if (!target.closest('.resize-handle')) {
                        handleDragStart(e, article);
                      }
                    }
                  }}
                  onMouseEnter={(e: React.MouseEvent) => handleArticleMouseEnter(e, article)}
                  onMouseLeave={handleArticleMouseLeave}
                  title={`${article.title}${article.description ? `\n${article.description}` : ''}`}
                >
                  {/* Poignées de redimensionnement */}
                  {resizeMode && (
                    <>
                      {/* Poignée Nord-Ouest */}
                      <div
                        className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-nw-resize"
                        style={{ top: '-6px', left: '-6px' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (onArticlePositionUpdate) {
                            handleResizeStart(e, article, 'nw');
                          }
                        }}
                      />
                      {/* Poignée Nord-Est */}
                      <div
                        className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-ne-resize"
                        style={{ top: '-6px', right: '-6px' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (onArticlePositionUpdate) {
                            handleResizeStart(e, article, 'ne');
                          }
                        }}
                      />
                      {/* Poignée Sud-Ouest */}
                      <div
                        className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-sw-resize"
                        style={{ bottom: '-6px', left: '-6px' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (onArticlePositionUpdate) {
                            handleResizeStart(e, article, 'sw');
                          }
                        }}
                      />
                      {/* Poignée Sud-Est */}
                      <div
                        className="resize-handle absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-se-resize"
                        style={{ bottom: '-6px', right: '-6px' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (onArticlePositionUpdate) {
                            handleResizeStart(e, article, 'se');
                          }
                        }}
                      />
                    </>
                  )}
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
                          if (onArticlePositionUpdate) {
                            // Activer le mode redimensionnement intégré
                            setResizeMode(true);
                            setOpenPopoverId(null);
                          } else {
                            // Fallback vers la fonction externe (redirection)
                            onArticleResize(article.id);
                            setOpenPopoverId(null);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Square size={16} />
                        {resizeMode ? "Mode redimensionnement actif" : "Redimensionner"}
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
                          handleDeleteArticle(article);
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
            } fast-tooltip`}
            style={{
              ...articleStyle,
              zIndex: isActive ? 10 : 5,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => handleArticleInteraction(e, article)}
            onMouseEnter={(e) => handleArticleMouseEnter(e, article)}
            onMouseLeave={handleArticleMouseLeave}
            title={`${article.title}${article.description ? `\n${article.description}` : ''}`}
          >
            {/* Zone cliquable/survolable pour chaque article positionné */}
          </div>
        );
      })}

      {/* Rectangle de dessin pour le nouvel article */}
      {isDrawingNew && newArticleSize.width > 0 && newArticleSize.height > 0 && (
        <div
          className="absolute border-2 border-purple-500 border-dashed bg-purple-500 bg-opacity-20 pointer-events-none z-20"
          style={{
            left: `${Math.min(newArticleStart.x, newArticleEnd.x)}px`,
            top: `${Math.min(newArticleStart.y, newArticleEnd.y)}px`,
            width: `${newArticleSize.width}px`,
            height: `${newArticleSize.height}px`,
          }}
        />
      )}

      {/* Modal d'édition */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              {/* @ts-expect-error - shadcn/ui Label component type issue */}
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
              {/* @ts-expect-error - shadcn/ui Label component type issue */}
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

      {/* Modal de suppression */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            {/* @ts-expect-error - shadcn/ui DialogTitle component type issue */}
            <DialogTitle className="text-red-600">Supprimer l&apos;article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Attention : Cette action est irréversible
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    Vous êtes sur le point de supprimer définitivement l&apos;article{" "}
                    <span className="font-semibold">&quot;{deletingArticle?.title}&quot;</span>.
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
              </div>
            </div>

            <div>
              {/* @ts-expect-error - shadcn/ui Label component type issue */}
              <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                Pour confirmer la suppression, tapez le nom exact de l&apos;article :
              </Label>
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded border">
                  {deletingArticle?.title}
                </div>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Tapez le nom de l'article ici"
                  className="focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                isDeleting ||
                !deletingArticle ||
                deleteConfirmText.trim() !== deletingArticle.title.trim()
              }
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création d'article */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouvel article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              {/* @ts-expect-error - shadcn/ui Label component type issue */}
              <Label htmlFor="createTitle">Titre</Label>
              <Input
                id="createTitle"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                placeholder="Titre de l'article"
              />
            </div>
            <div>
              {/* @ts-expect-error - shadcn/ui Label component type issue */}
              <Label htmlFor="createDescription">Description</Label>
              <Textarea
                id="createDescription"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Description de l'article (optionnelle)"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* @ts-expect-error - shadcn/ui Label component type issue */}
                <Label htmlFor="createPositionX">Position X (%)</Label>
                <Input
                  id="createPositionX"
                  type="number"
                  min={5}
                  max={95}
                  value={createForm.positionX}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, positionX: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                {/* @ts-expect-error - shadcn/ui Label component type issue */}
                <Label htmlFor="createPositionY">Position Y (%)</Label>
                <Input
                  id="createPositionY"
                  type="number"
                  min={5}
                  max={95}
                  value={createForm.positionY}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, positionY: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* @ts-expect-error - shadcn/ui Label component type issue */}
                <Label htmlFor="createWidth">Largeur (%)</Label>
                <Input
                  id="createWidth"
                  type="number"
                  min={5}
                  max={50}
                  value={createForm.width}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, width: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                {/* @ts-expect-error - shadcn/ui Label component type issue */}
                <Label htmlFor="createHeight">Hauteur (%)</Label>
                <Input
                  id="createHeight"
                  type="number"
                  min={3}
                  max={30}
                  value={createForm.height}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, height: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCreate}>
              Annuler
            </Button>
            <Button onClick={handleSaveCreate} disabled={isCreating || !createForm.title.trim()}>
              {isCreating ? "Création..." : "Créer l'article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
