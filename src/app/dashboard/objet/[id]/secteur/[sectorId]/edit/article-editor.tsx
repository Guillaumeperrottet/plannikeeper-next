// src/app/dashboard/objet/[id]/secteur/[sectorId]/edit/article-editor.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Move, X } from "lucide-react";

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
  children, // Ajout de la prop children qui remplacera <slot />
}: {
  sectorId: string;
  initialArticles?: Article[];
  children?: React.ReactNode; // Typage pour la prop children
}) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null
  );
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newArticlePosition, setNewArticlePosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalArticle, setModalArticle] = useState<{
    id?: string;
    title: string;
    description: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>({
    title: "",
    description: "",
    positionX: 0,
    positionY: 0,
    width: 20, // default width in percentage
    height: 20, // default height in percentage
  });

  useEffect(() => {
    // Update container size on window resize
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Load articles if not provided
  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles, sectorId]);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        toast.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des articles");
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingArticle && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setNewArticlePosition({ x, y });
      setModalArticle({
        ...modalArticle,
        positionX: x,
        positionY: y,
      });
      setShowModal(true);
      setIsAddingArticle(false);
    }
  };

  const startDragging = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    setSelectedArticleId(article.id);
    setIsDragging(true);

    if (
      containerRef.current &&
      article.positionX !== null &&
      article.positionY !== null
    ) {
      const rect = containerRef.current.getBoundingClientRect();
      const articleX = (article.positionX / 100) * rect.width;
      const articleY = (article.positionY / 100) * rect.height;

      setDragOffset({
        x: e.clientX - rect.left - articleX,
        y: e.clientY - rect.top - articleY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedArticleId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      // Convert to percentage
      const posX = (x / rect.width) * 100;
      const posY = (y / rect.height) * 100;

      // Update article position
      setArticles(
        articles.map((article) =>
          article.id === selectedArticleId
            ? {
                ...article,
                positionX: Math.max(0, Math.min(posX, 100)),
                positionY: Math.max(0, Math.min(posY, 100)),
              }
            : article
        )
      );
    }
  };

  const stopDragging = async () => {
    if (isDragging && selectedArticleId) {
      // Save the new position
      const article = articles.find((a) => a.id === selectedArticleId);
      if (article) {
        try {
          await saveArticle(article);
          toast.success("Position mise à jour");
        } catch (error) {
          console.error("Error updating position:", error);
          toast.error("Erreur lors de la mise à jour de la position");
        }
      }
    }

    setIsDragging(false);
    setSelectedArticleId(null);
  };

  const saveArticle = async (article: Article) => {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: article.id,
        title: article.title,
        description: article.description,
        positionX: article.positionX,
        positionY: article.positionY,
        width: article.width,
        height: article.height,
        sectorId,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la sauvegarde de l'article");
    }

    return await response.json();
  };

  const handleSaveModal = async () => {
    try {
      const articleData = {
        ...modalArticle,
        sectorId,
      };

      const savedArticle = await saveArticle(articleData as Article);

      if (modalArticle.id) {
        // Update existing article
        setArticles(
          articles.map((a) => (a.id === modalArticle.id ? savedArticle : a))
        );
      } else {
        // Add new article
        setArticles([...articles, savedArticle]);
      }

      setShowModal(false);
      toast.success("Article sauvegardé avec succès");
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erreur lors de la sauvegarde de l'article");
    }
  };

  const handleEditArticle = (article: Article) => {
    setModalArticle({
      id: article.id,
      title: article.title,
      description: article.description || "",
      positionX: article.positionX || 0,
      positionY: article.positionY || 0,
      width: article.width || 20,
      height: article.height || 20,
    });
    setShowModal(true);
  };

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 p-2 bg-white border-b">
        <button
          onClick={() => setIsAddingArticle(!isAddingArticle)}
          className={`flex items-center gap-2 px-3 py-2 rounded ${
            isAddingArticle ? "bg-blue-100 text-blue-700" : "bg-gray-100"
          }`}
        >
          <Plus size={16} />
          <span>
            {isAddingArticle
              ? "Cliquez sur l'image pour placer l'article"
              : "Ajouter un article"}
          </span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {/* Image container */}
        <div className="relative">
          <div className="w-full min-h-[500px] bg-gray-200">
            {/* Utilisation de children à la place de slot */}
            {children}
          </div>

          {/* Articles */}
          {articles.map(
            (article) =>
              article.positionX !== null &&
              article.positionY !== null && (
                <div
                  key={article.id}
                  className={`absolute border-2 ${
                    selectedArticleId === article.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-yellow-500 bg-yellow-50"
                  } rounded-md shadow-md cursor-move p-2 overflow-hidden`}
                  style={{
                    left: `${article.positionX}%`,
                    top: `${article.positionY}%`,
                    width: `${article.width || 20}%`,
                    height: `${article.height || 20}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseDown={(e) => startDragging(e, article)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold truncate">{article.title}</div>
                    <Move size={16} className="text-gray-500" />
                  </div>
                  {article.description && (
                    <div className="text-xs text-gray-600 truncate">
                      {article.description}
                    </div>
                  )}
                  <button
                    onClick={() => handleEditArticle(article)}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center"
                  >
                    <span className="sr-only">Modifier</span>
                    <svg width="10" height="10" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                      />
                    </svg>
                  </button>
                </div>
              )
          )}
        </div>
      </div>

      {/* Modal for adding/editing articles */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalArticle.id ? "Modifier l'article" : "Nouvel article"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={modalArticle.title}
                  onChange={(e) =>
                    setModalArticle({ ...modalArticle, title: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={modalArticle.description}
                  onChange={(e) =>
                    setModalArticle({
                      ...modalArticle,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Largeur (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={modalArticle.width}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        width: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hauteur (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={modalArticle.height}
                    onChange={(e) =>
                      setModalArticle({
                        ...modalArticle,
                        height: parseFloat(e.target.value),
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveModal}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
