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
import { AlertTriangle } from "lucide-react";
import { Article } from "../types";

type DeleteArticleModalProps = {
  open: boolean;
  article: Article | null;
  confirmText: string;
  isDeleting: boolean;
  onConfirmTextChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteArticleModal({
  open,
  article,
  confirmText,
  isDeleting,
  onConfirmTextChange,
  onConfirm,
  onCancel,
}: DeleteArticleModalProps) {
  if (!article) return null;

  const isConfirmValid = confirmText.trim() === article.title.trim();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Supprimer l&apos;article
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Attention : Cette action est irréversible
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Vous êtes sur le point de supprimer définitivement
                  l&apos;article{" "}
                  <span className="font-semibold">{article.title}</span>. Cette
                  action ne peut pas être annulée.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="deleteConfirm" className="text-sm font-medium">
              Pour confirmer la suppression, tapez le nom exact de
              l&apos;article :
            </label>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded border">
                {article.title}
              </div>
              <Input
                id="deleteConfirm"
                value={confirmText}
                onChange={(e) => onConfirmTextChange(e.target.value)}
                placeholder="Tapez le nom de l'article ici"
                className="focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || !isConfirmValid}
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
