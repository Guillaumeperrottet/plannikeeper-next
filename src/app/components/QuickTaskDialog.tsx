"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Calendar,
  Loader2,
  MapPin,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Objet {
  id: string;
  name: string;
  icon?: string;
}

interface Sector {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
}

interface QuickTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTaskDialog({ open, onOpenChange }: QuickTaskDialogProps) {
  const router = useRouter();
  const pathname = usePathname();

  // États pour les données
  const [objets, setObjets] = useState<Objet[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // États de chargement
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État pour les documents
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    objetId: "",
    sectorId: "",
    articleId: "",
    name: "",
    description: "",
    status: "pending",
    taskType: null as string | null,
    realizationDate: "",
    assignedToId: "",
    recurring: false,
    period: "weekly",
    endDate: "",
    color: "#3b82f6",
  });

  // Détecter le contexte automatiquement depuis l'URL
  useEffect(() => {
    if (open) {
      const pathParts = pathname.split("/");
      const objetIndex = pathParts.indexOf("objet");
      const secteurIndex = pathParts.indexOf("secteur");
      const articleIndex = pathParts.indexOf("article");

      const contextData: {
        objetId?: string;
        sectorId?: string;
        articleId?: string;
      } = {};

      if (objetIndex !== -1 && pathParts[objetIndex + 1]) {
        contextData.objetId = pathParts[objetIndex + 1];
      }
      if (secteurIndex !== -1 && pathParts[secteurIndex + 1]) {
        contextData.sectorId = pathParts[secteurIndex + 1];
      }
      if (articleIndex !== -1 && pathParts[articleIndex + 1]) {
        contextData.articleId = pathParts[articleIndex + 1];
      }

      setFormData((prev) => ({
        ...prev,
        ...contextData,
      }));

      loadInitialData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pathname]);

  const loadInitialData = async (context: {
    objetId?: string;
    sectorId?: string;
    articleId?: string;
  }) => {
    setIsLoadingData(true);
    try {
      // Charger les objets accessibles
      const objetsRes = await fetch("/api/objets");
      if (objetsRes.ok) {
        const objetsData = await objetsRes.json();
        setObjets(objetsData);
      }

      // Charger les utilisateurs de l'organisation
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Si contexte objet, charger les secteurs
      if (context.objetId) {
        await loadSectors(context.objetId);

        // Si contexte secteur, charger les articles
        if (context.sectorId) {
          await loadArticles(context.sectorId);
        }
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadSectors = async (objetId: string) => {
    try {
      const res = await fetch(`/api/objets/${objetId}/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      }
    } catch (error) {
      console.error("Erreur chargement secteurs:", error);
    }
  };

  const loadArticles = async (sectorId: string) => {
    try {
      const res = await fetch(`/api/sectors/${sectorId}/articles`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Erreur chargement articles:", error);
    }
  };

  const handleObjetChange = (objetId: string) => {
    setFormData((prev) => ({
      ...prev,
      objetId,
      sectorId: "",
      articleId: "",
    }));
    setSectors([]);
    setArticles([]);
    if (objetId) {
      loadSectors(objetId);
    }
  };

  const handleSectorChange = (sectorId: string) => {
    setFormData((prev) => ({
      ...prev,
      sectorId,
      articleId: "",
    }));
    setArticles([]);
    if (sectorId) {
      loadArticles(sectorId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Le nom de la tâche est requis");
      return;
    }
    if (!formData.articleId) {
      toast.error("Veuillez sélectionner un article");
      return;
    }
    if (!formData.assignedToId) {
      toast.error("Veuillez assigner la tâche à un utilisateur");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          articleId: formData.articleId,
          realizationDate: formData.realizationDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création");
      }

      const newTask = await response.json();

      // Uploader les documents si présents
      if (documents.length > 0) {
        const formDataUpload = new FormData();
        documents.forEach((file) => {
          formDataUpload.append("files", file);
        });

        try {
          await fetch(`/api/tasks/${newTask.id}/documents`, {
            method: "POST",
            body: formDataUpload,
          });
        } catch (uploadError) {
          console.error("Erreur upload documents:", uploadError);
          toast.warning(
            "Tâche créée mais erreur lors de l'upload des documents"
          );
        }
      }

      toast.success("Tâche créée avec succès");

      // Rediriger vers la tâche créée
      router.push(
        `/dashboard/objet/${formData.objetId}/secteur/${formData.sectorId}/article/${formData.articleId}/task/${newTask.id}`
      );

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création de la tâche");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      objetId: "",
      sectorId: "",
      articleId: "",
      name: "",
      description: "",
      status: "pending",
      taskType: null,
      realizationDate: "",
      assignedToId: "",
      recurring: false,
      period: "weekly",
      endDate: "",
      color: "#3b82f6",
    });
    setDocuments([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une tâche rapide</DialogTitle>
          <DialogDescription>
            Sélectionnez l&apos;emplacement et remplissez les informations de la
            tâche
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélection de l'emplacement */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Emplacement de la tâche
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Objet */}
                <div>
                  <Label htmlFor="objetId" className="text-xs">
                    Objet *
                  </Label>
                  <Select
                    value={formData.objetId}
                    onValueChange={handleObjetChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {objets.map((objet) => (
                        <SelectItem key={objet.id} value={objet.id}>
                          {objet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Secteur */}
                <div>
                  <Label htmlFor="sectorId" className="text-xs">
                    Secteur *
                  </Label>
                  <Select
                    value={formData.sectorId}
                    onValueChange={handleSectorChange}
                    disabled={!formData.objetId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Article */}
                <div>
                  <Label htmlFor="articleId" className="text-xs">
                    Article *
                  </Label>
                  <Select
                    value={formData.articleId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, articleId: value }))
                    }
                    disabled={!formData.sectorId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {articles.map((article) => (
                        <SelectItem key={article.id} value={article.id}>
                          {article.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informations de la tâche */}
            <AnimatePresence>
              {formData.articleId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Nom */}
                  <div>
                    <Label htmlFor="name">Nom de la tâche *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Vérifier les extincteurs"
                      required
                      className="mt-1"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Description détaillée (optionnelle)"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {/* Statut et Assignation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">À faire</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignedToId">Attribuer à *</Label>
                      <Select
                        value={formData.assignedToId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            assignedToId: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date de réalisation */}
                  <div>
                    <Label htmlFor="realizationDate">Date de réalisation</Label>
                    <div className="relative mt-1">
                      <Input
                        id="realizationDate"
                        type="date"
                        value={formData.realizationDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            realizationDate: e.target.value,
                          }))
                        }
                        className="pr-10"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <Label>Documents & Photos</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-gray-300"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,image/*"
                      />
                      <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez des fichiers ici
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Sélectionnez des fichiers
                      </Button>
                    </div>

                    {documents.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 space-y-2"
                      >
                        {documents.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                              <span className="text-sm truncate">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Récurrence */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={formData.recurring}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurring: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="recurring" className="font-normal">
                      Tâche récurrente
                    </Label>
                  </div>

                  {formData.recurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-primary"
                    >
                      <div>
                        <Label htmlFor="period">Période</Label>
                        <Select
                          value={formData.period}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, period: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuelle</SelectItem>
                            <SelectItem value="quarterly">
                              Trimestrielle
                            </SelectItem>
                            <SelectItem value="yearly">Annuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="endDate">Date de fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.articleId}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer la tâche"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
