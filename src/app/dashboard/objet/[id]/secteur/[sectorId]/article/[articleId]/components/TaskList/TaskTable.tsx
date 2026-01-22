"use client";

import { useState } from "react";
import { Task, SortField, SortDirection } from "../../lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  RefreshCcw,
  Edit,
  Trash2,
  Archive,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { formatDate } from "../../lib/taskHelpers";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface TaskTableProps {
  tasks: Task[];
  objetId: string;
  sectorId: string;
  articleId: string;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskTable({
  tasks,
  objetId,
  sectorId,
  articleId,
  sortField,
  sortDirection,
  onSort,
  onDelete,
  onArchive,
  onStatusChange,
}: TaskTableProps) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ src: string; alt: string; title: string }>
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleTaskClick = (taskId: string) => {
    router.push(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${taskId}`,
    );
  };

  const handleImageClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();

    const imageDocuments =
      task.documents?.filter((doc) => doc.fileType.startsWith("image/")) || [];

    if (imageDocuments.length > 0) {
      setLightboxImages(
        imageDocuments.map((doc) => ({
          src: doc.filePath,
          alt: doc.name,
          title: doc.name,
        })),
      );
      setLightboxIndex(0);
      setLightboxOpen(true);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUp className="w-4 h-4" />
      ) : (
        <ArrowDown className="w-4 h-4" />
      );
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-300" />;
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-gray-900 font-medium mb-2">Aucune tâche trouvée</p>
        <p className="text-sm text-gray-500">
          Essayez de modifier vos filtres ou créez une nouvelle tâche
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-gray-50">
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("status")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                STATUT
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead className="w-[280px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("name")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                TÂCHE
                {getSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">IMAGE</TableHead>
            <TableHead className="w-[140px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("assignedTo")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                ASSIGNÉ À{getSortIcon("assignedTo")}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("taskType")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                TYPE
                {getSortIcon("taskType")}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("createdAt")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                CRÉÉ LE
                {getSortIcon("createdAt")}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("realizationDate")}
                className="h-auto p-0 font-medium text-xs text-gray-600 hover:text-gray-900"
              >
                ÉCHÉANCE
                {getSortIcon("realizationDate")}
              </Button>
            </TableHead>
            <TableHead className="w-[80px]">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              onClick={() => handleTaskClick(task.id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <TableCell className="py-3 px-4">
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell className="py-3">
                <div className="space-y-1">
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    <span className="truncate">{task.name}</span>
                    {task.recurring && (
                      <RefreshCcw className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {task.description && (
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {task.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-3">
                {(() => {
                  const imageDocuments = task.documents?.filter((doc) =>
                    doc.fileType.startsWith("image/"),
                  );
                  if (imageDocuments && imageDocuments.length > 0) {
                    return (
                      <div
                        className="relative cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => handleImageClick(e, task)}
                      >
                        <Image
                          src={imageDocuments[0].filePath}
                          alt="Preview"
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded border border-gray-200"
                        />
                        {imageDocuments.length > 1 && (
                          <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            +{imageDocuments.length - 1}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return <span className="text-sm text-gray-400">-</span>;
                })()}
              </TableCell>
              <TableCell className="py-3">
                <div className="text-sm text-gray-900">
                  {task.assignedTo?.name || "Non assigné"}
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="text-sm text-gray-900">
                  {task.taskType || "-"}
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="text-sm text-gray-500">
                  {formatDate(task.createdAt)}
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="text-sm text-gray-500">
                  {formatDate(task.realizationDate) || "-"}
                </div>
              </TableCell>
              <TableCell className="py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task.id);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                    {["pending", "in_progress", "completed", "cancelled"].map(
                      (status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(task.id, status);
                          }}
                          className={
                            task.status === status
                              ? "text-primary bg-primary/10"
                              : ""
                          }
                        >
                          {status === "pending" && "À faire"}
                          {status === "in_progress" && "En cours"}
                          {status === "completed" && "Terminée"}
                          {status === "cancelled" && "Annulée"}
                          {task.status === status && (
                            <Check className="w-4 h-4 ml-auto" />
                          )}
                        </DropdownMenuItem>
                      ),
                    )}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Lightbox pour les images */}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
