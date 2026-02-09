import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Article } from "../types";

type EditArticleModalProps = {
  open: boolean;
  article: Article | null;
  title: string;
  description: string;
  isLoading: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function EditArticleModal({
  open,
  article,
  title,
  description,
  isLoading,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: EditArticleModalProps) {
  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-lg font-semibold">Modifier l&apos;article</h2>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="editTitle" className="text-sm font-medium">
              Titre
            </label>
            <Input
              id="editTitle"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Titre de l'article"
            />
          </div>
          <div>
            <label htmlFor="editDescription" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="editDescription"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Description de l'article (optionnelle)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isLoading || !title.trim()}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
