// Carte de tâche réutilisable
"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Task } from "../../types";
import { formatDate } from "../../utils/dateHelpers";
import { getStatusBadgeVariant, getStatusText } from "../../utils/taskFilters";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => Promise<void>;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  return (
    <motion.li key={task.id} whileTap={{ scale: 0.98 }}>
      <Card
        className="cursor-pointer hover:shadow-md transition-all bg-stone-50/50 border-stone-200/60"
        onClick={(e) => {
          e.stopPropagation();
          onClick(task);
        }}
      >
        <CardContent className="p-3">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <span className="font-medium">{task.name}</span>
              <Badge
                variant={
                  getStatusBadgeVariant(task.status) as
                    | "warning"
                    | "info"
                    | "success"
                    | "destructive"
                    | "secondary"
                }
              >
                {getStatusText(task.status)}
              </Badge>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {task.realizationDate && (
                  <span className="bg-muted/40 py-0.5 px-1.5 rounded">
                    {formatDate(task.realizationDate)}
                  </span>
                )}
                <span>• {task.article.sector.name}</span>
              </div>

              <div className="flex items-center gap-1">
                {task.assignedTo && (
                  <span className="text-xs text-muted-foreground">
                    {task.assignedTo.name}
                  </span>
                )}

                <ExternalLink
                  size={14}
                  className="text-muted-foreground ml-1"
                />
              </div>
            </div>

            {/* Titre de l'article */}
            <div className="mt-1 pt-1 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                Article: {task.article.title}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.li>
  );
};
