"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/ui/button";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
};

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error("Erreur lors de la récupération des commentaires");
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([newCommentData, ...comments]);
        setNewComment("");
        toast.success("Commentaire ajouté");
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Liste des commentaires - scrollable */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Aucun commentaire</p>
            <p className="text-xs text-muted-foreground mt-1">
              Soyez le premier à commenter
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                className="flex gap-3 group"
              >
                {/* Avatar */}
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
                    {comment.user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input sticky en bas - Style 2026 */}
      <div className="border-t pt-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            disabled={isSubmitting}
            className="resize-none min-h-[60px] text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            size="icon"
            className="shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd</kbd> +{" "}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> pour
          envoyer
        </p>
      </div>
    </div>
  );
}
