"use client";

import { Task } from "../../lib/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RefreshCcw,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
} from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { UserAvatar } from "../shared/UserAvatar";
import { formatDate } from "../../lib/taskHelpers";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  objetId: string;
  sectorId: string;
  articleId: string;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskCard({
  task,
  objetId,
  sectorId,
  articleId,
  onDelete,
  onArchive,
}: TaskCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${task.id}`
    );
  };

  const imageDocuments = task.documents?.filter((doc) =>
    doc.fileType.startsWith("image/")
  );

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.color || "#3b82f6" }}
            />
            <h3 className="font-medium text-gray-900 truncate">{task.name}</h3>
            {task.recurring && (
              <RefreshCcw className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {task.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.(task.id);
              }}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archiver
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(task.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image preview */}
      {imageDocuments && imageDocuments.length > 0 && (
        <div className="mb-3">
          <div className="relative w-full h-32 rounded-md overflow-hidden bg-gray-100">
            <Image
              src={imageDocuments[0].filePath}
              alt="Preview"
              fill
              className="object-cover"
            />
            {imageDocuments.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{imageDocuments.length - 1}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <StatusBadge status={task.status} />

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {task.taskType && (
            <span className="px-2 py-1 bg-gray-100 rounded">
              {task.taskType}
            </span>
          )}
          {task.assignedTo && <UserAvatar user={task.assignedTo} size="sm" />}
        </div>
      </div>

      {/* Dates */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Créé le {formatDate(task.createdAt)}</span>
        {task.realizationDate && (
          <span>Échéance: {formatDate(task.realizationDate)}</span>
        )}
      </div>
    </div>
  );
}
