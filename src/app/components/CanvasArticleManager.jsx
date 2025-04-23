"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function CanvasArticleManager({
  sectorId,
  objetId,
  initialArticles = [],
  children,
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startArticlePos, setStartArticlePos] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isAddingArticle, setIsAddingArticle] = useState(false);

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalArticle, setModalArticle] = useState({
    title: "",
    description: "",
    positionX: 0,
    positionY: 0,
    radius: 0.05, // 5% par défaut
  });

  // Effet pour mesurer et mettre à jour la taille du conteneur
  useEffect(() => {
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

  // Chargement initial des articles si nécessaire
  useEffect(() => {
    if (initialArticles.length === 0) {
      fetchArticles();
    }
  }, [initialArticles, sectorId]);

  // Fonction pour récupérer les articles depuis l'API
  const fetchArticles = async () => {
    try {
      // Correction de l'URL pour correspondre à votre API
      const response = await fetch(`/api/sectors/${sectorId}/articles`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data); // Adapté à la structure de votre réponse API
      } else {
        toast.error("Erreur lors du chargement des articles");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des articles");
    }
  };

  // Gérer le clic sur le conteneur
  const handleContainerClick = (e) => {
    // Si on est en mode ajout d'article, on place un nouvel article
    if (isAddingArticle && containerRef.current) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      const relativeY = (e.clientY - rect.top) / rect.height;

      setModalArticle({
        title: "",
        description: "",
        positionX: relativeX,
        positionY: relativeY,
        radius: 0.05,
      });

      setIsAddingArticle(false);
      setShowModal(true);
      return;
    }

    // Sinon, désélectionner l'article courant
    setSelectedArticleId(null);
  };

  // Gérer le clic sur un article
  const handleArticleClick = (e, article) => {
    e.stopPropagation();
    setSelectedArticleId(article.id);

    // Mettre à jour la position du tooltip
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const articleX = article.positionX * rect.width;
      const articleY = article.positionY * rect.height;
      setTooltipPosition({
        x: articleX,
        y: Math.max(20, articleY - article.radius * rect.width - 10),
      });
    }
  };

  // Démarrer le déplacement d'un article
  const handleStartDrag = (e, article) => {
    e.stopPropagation();
    e.preventDefault();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setIsDragging(true);
    setSelectedArticleId(article.id);

    // Enregistrer la position de départ
    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });

    // Enregistrer la position de départ de l'article
    setStartArticlePos({
      x: article.positionX,
      y: article.positionY,
    });
  };

  // Gérer le déplacement d'un article
  const handleMouseMove = (e) => {
    if (!isDragging || !selectedArticleId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Calculer le déplacement
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // Convertir en valeurs relatives
    const relDeltaX = deltaX / rect.width;
    const relDeltaY = deltaY / rect.height;

    // Calculer les nouvelles positions
    const newPosX = Math.max(0, Math.min(1, startArticlePos.x + relDeltaX));
    const newPosY = Math.max(0, Math.min(1, startArticlePos.y + relDeltaY));

    // Mettre à jour l'article
    setArticles(
      articles.map((article) =>
        article.id === selectedArticleId
          ? { ...article, positionX: newPosX, positionY: newPosY }
          : article
      )
    );

    // Mettre à jour la position du tooltip
    const article = articles.find((a) => a.id === selectedArticleId);
    if (article) {
      setTooltipPosition({
        x: newPosX * rect.width,
        y: Math.max(
          20,
          newPosY * rect.height - article.radius * rect.width - 10
        ),
      });
    }
  };

  // Terminer le déplacement d'un article
  const handleMouseUp = async () => {
    if (isDragging && selectedArticleId) {
      // Récupérer l'article modifié
      const article = articles.find((a) => a.id === selectedArticleId);

      if (article) {
        try {
          // Sauvegarder les modifications
          await saveArticle(article);
          toast.success("Position mise à jour");
        } catch (error) {
          console.error("Erreur lors de la mise à jour:", error);
          toast.error("Erreur lors de la mise à jour de l'article");
        }
      }
    }

    setIsDragging(false);
  };

  // Sauvegarder un article via l'API
  const saveArticle = async (article) => {
    const response = await fetch(`/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: article.id,
        title: article.title,
        description: article.description,
        positionX: article.positionX,
        positionY: article.positionY,
        radius: article.radius,
        sectorId,
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la sauvegarde de l'article");
    }

    return await response.json();
  };

  // Supprimer un article
  const handleDeleteArticle = async (article) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'article");
      }

      setArticles(articles.filter((a) => a.id !== article.id));
      setSelectedArticleId(null);
      toast.success("Article supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression de l'article");
    }
  };

  // Modifier un article existant
  const handleEditArticle = (article) => {
    setModalArticle({
      id: article.id,
      title: article.title,
      description: article.description || "",
      positionX: article.positionX,
      positionY: article.positionY,
      radius: article.radius || 0.05,
    });
    setShowModal(true);
  };

  // Sauvegarder l'article depuis le modal
  const handleSaveModal = async () => {
    try {
      const articleData = { ...modalArticle, sectorId };
      const savedArticle = await saveArticle(articleData);

      if (modalArticle.id) {
        // Mise à jour d'un article existant
        setArticles(
          articles.map((a) => (a.id === modalArticle.id ? savedArticle : a))
        );
      } else {
        // Ajout d'un nouvel article
        setArticles([...articles, savedArticle]);
      }

      setShowModal(false);
      toast.success("Article sauvegardé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde de l'article");
    }
  };

  // Effet pour ajouter les gestionnaires d'événements
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedArticleId, articles, startPos, startArticlePos]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 p-2 bg-white border-b">
        <button
          onClick={() => {
            setIsAddingArticle(!isAddingArticle);
            setSelectedArticleId(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded ${
            isAddingArticle ? "bg-blue-100 text-blue-700" : "bg-gray-100"
          }`}
        >
          <Plus size={16} />
          <span>
            {isAddingArticle
              ? "Cliquez pour placer un article"
              : "Ajouter un article"}
          </span>
        </button>
      </div>

      {/* Zone de contenu */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${
          isAddingArticle ? "cursor-crosshair" : ""
        }`}
        onClick={handleContainerClick}
      >
        <div className="relative">
          {/* Image ou fond */}
          <div className="w-full min-h-[500px] bg-gray-200">{children}</div>

          {/* Articles */}
          {articles.map((article) => {
            if (
              article.positionX == null ||
              article.positionY == null ||
              article.radius == null
            )
              return null;

            // Calculer la taille en %
            const diameterPercent = article.radius * 2 * 100;

            return (
              <div
                key={article.id}
                className={`absolute border ${
                  selectedArticleId === article.id
                    ? "border-blue-500"
                    : "border-white"
                } rounded-full shadow-md overflow-hidden`}
                style={{
                  left: `${article.positionX * 100}%`,
                  top: `${article.positionY * 100}%`,
                  width: `${diameterPercent}%`,
                  height: `${diameterPercent}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: selectedArticleId === article.id ? 10 : 5,
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                }}
                onClick={(e) => handleArticleClick(e, article)}
                onMouseDown={(e) => handleStartDrag(e, article)}
              />
            );
          })}

          {/* Tooltip pour l'article sélectionné */}
          {selectedArticleId &&
            (() => {
              const article = articles.find((a) => a.id === selectedArticleId);
              if (!article) return null;

              return (
                <div
                  className="absolute z-30 bg-white border shadow-lg rounded-md p-2 flex flex-col gap-2 w-48"
                  style={{
                    top: `${tooltipPosition.y}px`,
                    left: `${tooltipPosition.x}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate">
                      {article.title}
                    </span>
                  </div>
                  {article.description && (
                    <div className="text-xs mb-2 text-gray-600 max-h-20 overflow-y-auto">
                      {article.description}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditArticle(article);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArticle(article);
                      }}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                    >
                      <span>Supprimer</span>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                </div>
              );
            })()}
        </div>
      </div>

      {/* Modal pour créer/éditer un article */}
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
                X
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Taille (%)
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={modalArticle.radius * 100}
                  onChange={(e) =>
                    setModalArticle({
                      ...modalArticle,
                      radius: parseFloat(e.target.value) / 100,
                    })
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {Math.round(modalArticle.radius * 100)}% de la largeur
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
