import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateArticleModalProps = {
  open: boolean;
  title: string;
  description: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isCreating: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onPositionXChange: (x: number) => void;
  onPositionYChange: (y: number) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function CreateArticleModal({
  open,
  title,
  description,
  positionX,
  positionY,
  width,
  height,
  isCreating,
  onTitleChange,
  onDescriptionChange,
  onPositionXChange,
  onPositionYChange,
  onWidthChange,
  onHeightChange,
  onSave,
  onCancel,
}: CreateArticleModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouvel article</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="createTitle" className="text-sm font-medium">
              Titre
            </label>
            <Input
              id="createTitle"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Titre de l'article"
            />
          </div>
          <div>
            <label htmlFor="createDescription" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="createDescription"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Description de l'article (optionnelle)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="createPositionX" className="text-sm font-medium">
                Position X (%)
              </label>
              <Input
                id="createPositionX"
                type="number"
                min={5}
                max={95}
                value={positionX}
                onChange={(e) => onPositionXChange(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="createPositionY" className="text-sm font-medium">
                Position Y (%)
              </label>
              <Input
                id="createPositionY"
                type="number"
                min={5}
                max={95}
                value={positionY}
                onChange={(e) => onPositionYChange(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="createWidth" className="text-sm font-medium">
                Largeur (%)
              </label>
              <Input
                id="createWidth"
                type="number"
                min={5}
                max={50}
                value={width}
                onChange={(e) => onWidthChange(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="createHeight" className="text-sm font-medium">
                Hauteur (%)
              </label>
              <Input
                id="createHeight"
                type="number"
                min={3}
                max={30}
                value={height}
                onChange={(e) => onHeightChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isCreating || !title.trim()}>
            {isCreating ? "Création..." : "Créer l'article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
