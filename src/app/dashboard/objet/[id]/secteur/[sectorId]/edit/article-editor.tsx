"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeft, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ImageWithArticles from "@/app/components/ImageWithArticles";

type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

export default function ArticleEditor({
  sectorId,
  initialArticles = [],
  imageWidth = null,
  imageHeight = null,
  imageSrc,
  imageAlt,
}: {
  sectorId: string;
  initialArticles?: Article[];
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageSrc: string;
  imageAlt: string;
}) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  );
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTools, setShowTools] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Récupérer les articles depuis l'API
  const fetchArticles = useCallback(async () => {
    try {
      const response = await fetch(`/api/secteur/${sectorId}/article`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erreur lors du chargement des articles");
    }
  }, [sectorId]);

  // Charger les articles au montage si pas d'articles initiaux
  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles.length, fetchArticles]);

  // Créer un article
  const handleArticleCreate = useCallback(
    async (articleData: {
      title: string;
      description: string;
      positionX: number;
      positionY: number;
      width: number;
      height: number;
    }) => {
      try {
        const response = await fetch(`/api/secteur/${sectorId}/article`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData),
        });

        if (response.ok) {
          const newArticle = await response.json();
          setArticles((prev) => [...prev, newArticle]);
          toast.success("Article créé avec succès");
          setCreateMode(false);
        } else {
          toast.error("Erreur lors de la création de l'article");
        }
      } catch (error) {
        console.error("Error creating article:", error);
        toast.error("Erreur lors de la création de l'article");
      }
    },
    [sectorId],
  );

  // Mettre à jour un article (titre/description)
  const handleArticleUpdate = useCallback(
    async (
      articleId: string,
      updates: { title?: string; description?: string },
    ) => {
      try {
        const response = await fetch(
          `/api/secteur/${sectorId}/article/${articleId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
        );

        if (response.ok) {
          const updatedArticle = await response.json();
          setArticles((prev) =>
            prev.map((a) => (a.id === articleId ? updatedArticle : a)),
          );
          toast.success("Article mis à jour");
        } else {
          toast.error("Erreur lors de la mise à jour");
        }
      } catch (error) {
        console.error("Error updating article:", error);
        toast.error("Erreur lors de la mise à jour");
      }
    },
    [sectorId],
  );

  // Mettre à jour la position/taille d'un article
  const handleArticlePositionUpdate = useCallback(
    async (
      articleId: string,
      updates: {
        positionX?: number;
        positionY?: number;
        width?: number;
        height?: number;
      },
    ) => {
      try {
        const response = await fetch(
          `/api/secteur/${sectorId}/article/${articleId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
        );

        if (response.ok) {
          const updatedArticle = await response.json();
          setArticles((prev) =>
            prev.map((a) => (a.id === articleId ? updatedArticle : a)),
          );
        } else {
          toast.error("Erreur lors de la mise à jour de la position");
        }
      } catch (error) {
        console.error("Error updating article position:", error);
        toast.error("Erreur lors de la mise à jour de la position");
      }
    },
    [sectorId],
  );

  // Supprimer un article
  const handleArticleDelete = useCallback(
    async (articleId: string) => {
      try {
        const response = await fetch(
          `/api/secteur/${sectorId}/article/${articleId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setArticles((prev) => prev.filter((a) => a.id !== articleId));
          toast.success("Article supprimé");
          if (selectedArticleId === articleId) {
            setSelectedArticleId(null);
          }
        } else {
          toast.error("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Error deleting article:", error);
        toast.error("Erreur lors de la suppression");
      }
    },
    [sectorId, selectedArticleId],
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Barre d'outils fixe */}
      <div className="sticky top-0 z-20 px-4 py-2 md:py-3 bg-background/95 backdrop-blur-sm border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            aria-label="Retour"
            className="text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-medium">Édition des articles</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton aide */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Aide"
          >
            <Info size={20} />
          </Button>

          {/* Toggle tools sur mobile */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTools(!showTools)}
              aria-label="Afficher/masquer les outils"
            >
              {showTools ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          )}

          {/* Bouton créer */}
          <Button
            variant={createMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCreateMode(!createMode)}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden md:inline">
              {createMode ? "Annuler" : "Créer"}
            </span>
          </Button>
        </div>
      </div>

      {/* Message d'aide contextuel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h3 className="font-semibold mb-2 text-blue-900">
              Guide d&apos;édition
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Cliquez sur &quot;Créer&quot; puis dessinez sur l&apos;image
              </li>
              <li>• Clic droit sur un article pour accéder aux options</li>
              <li>• Utilisez les modes Déplacer et Redimensionner</li>
              <li>
                • Sur mobile, touchez un article puis utilisez les boutons
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composant ImageWithArticles */}
      <div className="flex-1 overflow-auto">
        <ImageWithArticles
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          originalWidth={imageWidth || 1200}
          originalHeight={imageHeight || 900}
          articles={articles}
          onArticleHover={setHoveredArticleId}
          hoveredArticleId={hoveredArticleId}
          selectedArticleId={selectedArticleId}
          isEditable={true}
          onArticleMove={() => {}}
          onArticleResize={() => {}}
          onArticleEdit={() => {}}
          onArticleDelete={handleArticleDelete}
          onArticleUpdate={handleArticleUpdate}
          onArticlePositionUpdate={handleArticlePositionUpdate}
          onArticleCreate={handleArticleCreate}
          createMode={createMode}
          onCreateModeChange={setCreateMode}
          className="max-h-[calc(100vh-80px)]"
        />
      </div>
    </div>
  );
}
