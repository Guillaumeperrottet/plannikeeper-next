"use client";

import { useState, useEffect } from "react";
import { Task, TaskFilter, SortField, SortDirection } from "../lib/types";
import { filterTasks, sortTasks } from "../lib/taskHelpers";

export function useTaskFilters(initialTasks: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    let result = filterTasks(tasks, searchQuery, activeFilter);
    result = sortTasks(result, sortField, sortDirection);
    setFilteredTasks(result);
  }, [tasks, searchQuery, activeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return {
    tasks,
    setTasks,
    filteredTasks,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortField,
    sortDirection,
    handleSort,
  };
}
