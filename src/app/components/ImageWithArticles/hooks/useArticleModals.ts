import { useState, useCallback } from "react";
import { Article, ArticleUpdate, ArticleCreateData } from "../types";
import {
  DEFAULT_ARTICLE_HEIGHT,
  DEFAULT_ARTICLE_POSITION_X,
  DEFAULT_ARTICLE_POSITION_Y,
  DEFAULT_ARTICLE_WIDTH,
} from "../constants";
import { showErrorToast } from "../utils/errorHandlers";

type UseArticleModalsProps = {
  onArticleUpdate?: (
    articleId: string,
    updates: ArticleUpdate,
  ) => Promise<void>;
  onArticleDelete?: (articleId: string) => Promise<void>;
  onArticleCreate?: (articleData: ArticleCreateData) => Promise<void>;
  onCreateModeChange?: (createMode: boolean) => void;
};

/**
 * Hook pour gérer les modals d'édition, suppression et création d'articles
 */
export function useArticleModals({
  onArticleUpdate,
  onArticleDelete,
  onArticleCreate,
  onCreateModeChange,
}: UseArticleModalsProps) {
  // États pour le modal d'édition
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // États pour le modal de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le modal de création
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    positionX: DEFAULT_ARTICLE_POSITION_X,
    positionY: DEFAULT_ARTICLE_POSITION_Y,
    width: DEFAULT_ARTICLE_WIDTH,
    height: DEFAULT_ARTICLE_HEIGHT,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fonctions pour le modal d'édition
  const openEditModal = useCallback((article: Article) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      description: article.description || "",
    });
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingArticle || !onArticleUpdate) return;

    setIsLoadingEdit(true);
    try {
      await onArticleUpdate(editingArticle.id, editForm);
      setEditModalOpen(false);
      setEditingArticle(null);
      setEditForm({ title: "", description: "" });
    } catch {
      showErrorToast("modification");
    } finally {
      setIsLoadingEdit(false);
    }
  }, [editingArticle, editForm, onArticleUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingArticle(null);
    setEditForm({ title: "", description: "" });
  }, []);

  // Fonctions pour le modal de suppression
  const openDeleteModal = useCallback((article: Article) => {
    setDeletingArticle(article);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingArticle || !onArticleDelete) return;

    if (deleteConfirmText.trim() !== deletingArticle.title.trim()) {
      return;
    }

    setIsDeleting(true);
    try {
      await onArticleDelete(deletingArticle.id);
      setDeleteModalOpen(false);
      setDeletingArticle(null);
      setDeleteConfirmText("");
    } catch {
      showErrorToast("suppression");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingArticle, deleteConfirmText, onArticleDelete]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingArticle(null);
    setDeleteConfirmText("");
  }, []);

  // Fonctions pour le modal de création
  const openCreateModal = useCallback(
    (positionX: number, positionY: number, width: number, height: number) => {
      setCreateForm({
        title: "",
        description: "",
        positionX,
        positionY,
        width,
        height,
      });
      setCreateModalOpen(true);
      if (onCreateModeChange) {
        onCreateModeChange(false);
      }
    },
    [onCreateModeChange],
  );

  const handleSaveCreate = useCallback(async () => {
    if (!createForm.title.trim() || !onArticleCreate) return;

    setIsCreating(true);
    try {
      await onArticleCreate(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        positionX: DEFAULT_ARTICLE_POSITION_X,
        positionY: DEFAULT_ARTICLE_POSITION_Y,
        width: DEFAULT_ARTICLE_WIDTH,
        height: DEFAULT_ARTICLE_HEIGHT,
      });
    } catch {
      showErrorToast("création");
    } finally {
      setIsCreating(false);
    }
  }, [createForm, onArticleCreate]);

  const handleCancelCreate = useCallback(() => {
    setCreateModalOpen(false);
    setCreateForm({
      title: "",
      description: "",
      positionX: DEFAULT_ARTICLE_POSITION_X,
      positionY: DEFAULT_ARTICLE_POSITION_Y,
      width: DEFAULT_ARTICLE_WIDTH,
      height: DEFAULT_ARTICLE_HEIGHT,
    });
  }, []);

  return {
    // États d'édition
    editModalOpen,
    editingArticle,
    editForm,
    isLoadingEdit,
    setEditForm,
    openEditModal,
    handleSaveEdit,
    handleCancelEdit,
    // États de suppression
    deleteModalOpen,
    deletingArticle,
    deleteConfirmText,
    isDeleting,
    setDeleteConfirmText,
    openDeleteModal,
    handleConfirmDelete,
    handleCancelDelete,
    // États de création
    createModalOpen,
    createForm,
    isCreating,
    setCreateForm,
    openCreateModal,
    handleSaveCreate,
    handleCancelCreate,
  };
}
