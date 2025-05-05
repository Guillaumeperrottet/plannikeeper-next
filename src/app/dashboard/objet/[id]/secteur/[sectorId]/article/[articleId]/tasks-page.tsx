"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import { toast } from "sonner";
import TaskFormMobileOptimized from "./TaskFormMobileOptimized";
import TaskForm from "./task-form";
import {
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  CircleOff,
  LayoutList,
  X,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  executantComment: string | null;
  done: boolean;
  realizationDate: Date | null;
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
  recurrenceReminderDate: Date | null;
  assignedToId: string | null;
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function ModernTasksPage({
  initialTasks,
  users,
  articleId,
  articleTitle,
  objetId,
  sectorId,
}: {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterTaskType, setFilterTaskType] = useState<string | null>(null);
  const [useOptimizedForm, setUseOptimizedForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setUseOptimizedForm(isMobile);
      setIsMobileView(isMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Group tasks by status for column display
  const taskColumns = useMemo(() => {
    return {
      pending: filteredTasks.filter((task) => task.status === "pending"),
      in_progress: filteredTasks.filter(
        (task) => task.status === "in_progress"
      ),
      completed: filteredTasks.filter((task) => task.status === "completed"),
      cancelled: filteredTasks.filter((task) => task.status === "cancelled"),
    };
  }, [filteredTasks]);

  // Apply filters to tasks
  useEffect(() => {
    let result = [...tasks];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.description?.toLowerCase() || "").includes(query) ||
          (task.taskType?.toLowerCase() || "").includes(query) ||
          (task.assignedTo?.name.toLowerCase() || "").includes(query)
      );
    }

    if (filterStatus.length > 0) {
      result = result.filter((task) => filterStatus.includes(task.status));
    }

    if (filterAssignee) {
      result = result.filter((task) => task.assignedToId === filterAssignee);
    }

    if (filterTaskType) {
      result = result.filter((task) => task.taskType === filterTaskType);
    }

    setFilteredTasks(result);
  }, [tasks, searchQuery, filterStatus, filterAssignee, filterTaskType]);

  // Get unique task types for filter dropdown
  const uniqueTaskTypes = useMemo(() => {
    const types = tasks
      .map((task) => task.taskType)
      .filter((type): type is string => type !== null && type !== "");

    return [...new Set(types)];
  }, [tasks]);

  // Handle drag and drop between columns
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Create a new task with updated status
    const updatedTask = {
      ...task,
      status: destination.droppableId,
      done: destination.droppableId === "completed",
    };

    // Optimistically update the UI
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? updatedTask : t))
    );

    try {
      // Update on the server
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: destination.droppableId,
          done: destination.droppableId === "completed",
        }),
      });

      if (!response.ok) throw new Error("Failed to update task status");

      toast.success(`Task moved to ${getStatusName(destination.droppableId)}`);
    } catch {
      // Revert the change if it fails
      setTasks((prev) => prev.map((t) => (t.id === draggableId ? task : t)));
      toast.error("Failed to update task status");
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "pending":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "cancelled":
        return <CircleOff className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const handleTaskClick = (taskId: string) => {
    window.location.href = `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${taskId}`;
  };

  const handleTaskMenuToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTaskMenuOpen(taskMenuOpen === taskId ? null : taskId);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // Find the task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Create a new task with updated status
    const updatedTask = {
      ...task,
      status: newStatus,
      done: newStatus === "completed",
    };

    // Optimistically update the UI
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      // Update on the server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) throw new Error("Failed to update task status");

      toast.success(`Task moved to ${getStatusName(newStatus)}`);
    } catch {
      // Revert the change if it fails
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      toast.error("Failed to update task status");
    } finally {
      setTaskMenuOpen(null);
    }
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowAddForm(true);
    setTaskMenuOpen(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    // Optimistically remove from UI
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskMenuOpen(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      toast.success("Task deleted successfully");
    } catch {
      // Restore the task if delete fails
      if (taskToDelete) {
        setTasks((prev) => [...prev, taskToDelete]);
      }
      toast.error("Failed to delete task");
    }
  };

  const handleNewTask = () => {
    setSelectedTaskId(null);
    setShowAddForm(true);
  };

  // Define FormTask type to match what TaskForm expects
  type FormTask = Omit<
    Task,
    "id" | "assignedTo" | "createdAt" | "updatedAt"
  > & { id?: string };

  const handleTaskSave = async (
    updatedTask: Task | FormTask,
    documents?: File[]
  ) => {
    try {
      const isNewTask =
        !updatedTask.id || !tasks.some((t) => t.id === updatedTask.id);

      if (isNewTask) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedTask,
            articleId,
          }),
        });

        if (!response.ok) throw new Error("Error creating task");

        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
        toast.success("Task created successfully");

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(newTask.id, documents);
        }
      } else {
        const taskId = updatedTask.id as string;
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        });

        if (!response.ok) throw new Error("Error updating task");

        const updated = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        toast.success("Task updated successfully");

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(updated.id, documents);
        }
      }

      setShowAddForm(false);
      setSelectedTaskId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const uploadDocumentsForTask = async (taskId: string, documents: File[]) => {
    try {
      const uploadPromises = documents.map(async (document) => {
        const formData = new FormData();
        formData.append("file", document);

        const response = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Error uploading ${document.name}`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      toast.success(`${documents.length} document(s) added to task`);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(
        error instanceof Error ? error.message : "Error adding documents"
      );
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus([]);
    setFilterAssignee(null);
    setFilterTaskType(null);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const getSelectedTask = () => {
    if (!selectedTaskId) return undefined;
    return tasks.find((task) => task.id === selectedTaskId) || undefined;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main content area with integrated filter area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden flex flex-col md:flex-row"
      >
        <AnimatePresence mode="wait">
          {showAddForm ? (
            useOptimizedForm ? (
              <TaskFormMobileOptimized
                task={getSelectedTask()}
                users={users}
                articleId={articleId}
                onSave={handleTaskSave}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedTaskId(null);
                }}
              />
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-auto p-4"
              >
                <TaskForm
                  task={getSelectedTask()}
                  users={users}
                  articleId={articleId}
                  onSave={handleTaskSave}
                  onCancel={() => {
                    setShowAddForm(false);
                    setSelectedTaskId(null);
                  }}
                />
              </motion.div>
            )
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 flex flex-col">
                {/* Compact header with title, search and actions */}
                <div className="bg-white border-b p-2 flex justify-between items-center gap-2">
                  <div className="font-medium truncate text-sm md:text-base">
                    {articleTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-40 md:w-52">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-1 rounded-md ${showFilters ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNewTask}
                      className="bg-blue-600 text-white p-1 rounded-md shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter panel (expandable) */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border-b border-gray-200 overflow-hidden"
                    >
                      <div className="p-3 space-y-3">
                        {/* Status filter */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "pending",
                              "in_progress",
                              "completed",
                              "cancelled",
                            ].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setFilterStatus((prev) =>
                                    prev.includes(status)
                                      ? prev.filter((s) => s !== status)
                                      : [...prev, status]
                                  );
                                }}
                                className={`px-2 py-0.5 text-xs rounded-full border ${
                                  filterStatus.includes(status)
                                    ? getStatusColor(status)
                                    : "border-gray-300 bg-white text-gray-700"
                                }`}
                              >
                                {getStatusName(status)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Assignee filter */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Assignee
                            </label>
                            <select
                              value={filterAssignee || ""}
                              onChange={(e) =>
                                setFilterAssignee(e.target.value || null)
                              }
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">All assignees</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Task type filter if types exist */}
                          {uniqueTaskTypes.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Task type
                              </label>
                              <select
                                value={filterTaskType || ""}
                                onChange={(e) =>
                                  setFilterTaskType(e.target.value || null)
                                }
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">All types</option>
                                {uniqueTaskTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Reset filters button */}
                        <div className="flex justify-end">
                          <button
                            onClick={resetFilters}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Reset filters
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Task columns */}
                <div className="flex-1 flex overflow-x-auto md:space-x-2 pb-1 pt-1 px-1">
                  {/* Render each status column */}
                  {["pending", "in_progress", "completed", "cancelled"].map(
                    (status) => (
                      <div
                        key={status}
                        className="flex-1 min-w-[250px] md:min-w-0"
                      >
                        <div
                          className={`rounded-t-md px-2 py-1.5 ${getStatusColor(status)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              <h3 className="font-medium text-xs">
                                {getStatusName(status)}
                              </h3>
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-white bg-opacity-70 rounded-full">
                              {
                                taskColumns[status as keyof typeof taskColumns]
                                  .length
                              }
                            </span>
                          </div>
                        </div>

                        <Droppable droppableId={status}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`bg-white rounded-b-md p-1 shadow-sm border border-t-0 border-gray-200 h-[calc(100vh-110px)] overflow-y-auto ${
                                snapshot.isDraggingOver ? "bg-blue-50" : ""
                              }`}
                            >
                              {taskColumns[status as keyof typeof taskColumns]
                                .length === 0 ? (
                                <div className="text-center py-2 text-gray-500 text-xs">
                                  {status === "pending"
                                    ? "No tasks yet. Add one!"
                                    : `No ${getStatusName(status).toLowerCase()} tasks`}
                                </div>
                              ) : (
                                taskColumns[
                                  status as keyof typeof taskColumns
                                ].map((task, index) => (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`relative p-2 mb-1 bg-white border rounded-md shadow-sm ${
                                          snapshot.isDragging ? "shadow-md" : ""
                                        }`}
                                        style={{
                                          ...provided.draggableProps.style,
                                          borderLeftWidth: "3px",
                                          borderLeftColor:
                                            task.color || "#d9840d",
                                        }}
                                        onClick={() => handleTaskClick(task.id)}
                                      >
                                        <div className="flex justify-between items-start mb-1">
                                          <h4 className="font-medium text-xs">
                                            {task.name}
                                          </h4>
                                          <div className="relative">
                                            <button
                                              onClick={(e) =>
                                                handleTaskMenuToggle(task.id, e)
                                              }
                                              className="text-gray-500 hover:text-gray-700 p-0.5"
                                            >
                                              <MoreHorizontal className="w-3 h-3" />
                                            </button>

                                            {/* Dropdown menu */}
                                            {taskMenuOpen === task.id && (
                                              <div className="absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg w-36">
                                                <ul className="py-1 text-xs">
                                                  <li>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTask(task.id);
                                                      }}
                                                      className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                      <Edit className="w-3 h-3" />
                                                      Edit
                                                    </button>
                                                  </li>
                                                  {status !== "completed" && (
                                                    <li>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleTaskStatusChange(
                                                            task.id,
                                                            "completed"
                                                          );
                                                        }}
                                                        className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2 text-emerald-600"
                                                      >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Complete
                                                      </button>
                                                    </li>
                                                  )}
                                                  {status === "completed" && (
                                                    <li>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleTaskStatusChange(
                                                            task.id,
                                                            "pending"
                                                          );
                                                        }}
                                                        className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2"
                                                      >
                                                        <Clock className="w-3 h-3" />
                                                        Reopen
                                                      </button>
                                                    </li>
                                                  )}
                                                  <li>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTask(
                                                          task.id
                                                        );
                                                      }}
                                                      className="w-full text-left px-3 py-1 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                      Delete
                                                    </button>
                                                  </li>
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Task details */}
                                        <div>
                                          {task.description && (
                                            <p className="text-[10px] text-gray-600 line-clamp-1 mb-1">
                                              {task.description}
                                            </p>
                                          )}

                                          <div className="flex flex-wrap gap-1">
                                            {task.realizationDate && (
                                              <span className="flex items-center gap-0.5 text-[10px] bg-gray-100 px-1 py-0.5 rounded">
                                                <Calendar className="w-2 h-2 text-gray-500" />
                                                <span>
                                                  {formatDate(
                                                    task.realizationDate
                                                  )}
                                                </span>
                                              </span>
                                            )}

                                            {task.assignedTo && (
                                              <span className="flex items-center gap-0.5 text-[10px] bg-gray-100 px-1 py-0.5 rounded">
                                                <User className="w-2 h-2 text-gray-500" />
                                                <span className="truncate max-w-[80px]">
                                                  {task.assignedTo.name}
                                                </span>
                                              </span>
                                            )}

                                            {task.taskType && (
                                              <span className="flex items-center gap-0.5 text-[10px] bg-gray-100 px-1 py-0.5 rounded">
                                                <Tag className="w-2 h-2 text-gray-500" />
                                                <span>{task.taskType}</span>
                                              </span>
                                            )}

                                            {task.recurring && (
                                              <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                                                <Clock className="w-2 h-2" />
                                                <span>Recurring</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}

                              {/* Add task button at bottom of pending column */}
                              {status === "pending" && (
                                <button
                                  onClick={handleNewTask}
                                  className="w-full p-1 mt-1 flex items-center justify-center gap-1 text-xs text-gray-600 hover:bg-gray-50 rounded-md border border-dashed border-gray-300"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add task</span>
                                </button>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )
                  )}
                </div>
              </div>
            </DragDropContext>
          )}
        </AnimatePresence>
      </div>

      {/* Empty state when no tasks and no filters */}
      {filteredTasks.length === 0 && !showAddForm && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10 p-4">
          {searchQuery ||
          filterStatus.length > 0 ||
          filterAssignee ||
          filterTaskType ? (
            <div className="text-center max-w-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Filter className="w-5 h-5 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium mb-2 text-gray-900">
                No matching tasks
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Try adjusting your filters to find what you&apos;re looking for.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <LayoutList className="w-7 h-7 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-gray-900">
                No tasks yet
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Get started by creating your first task for this article.
              </p>
              <button
                onClick={handleNewTask}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create first task</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating add button for mobile view */}
      {!showAddForm && !isMobileView && (
        <div className="md:hidden fixed bottom-5 right-5 z-10">
          <button
            onClick={handleNewTask}
            className="bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
