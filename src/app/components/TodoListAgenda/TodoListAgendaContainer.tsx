// Container principal de l'agenda - Orchestre tous les composants
"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useSpring } from "framer-motion";
import { useLoadingSystem } from "@/app/components/LoadingSystem";
import { TodoListAgendaProps, Task } from "./types";
import { getThisWeekEnd } from "./utils/dateHelpers";
import { useAgendaState } from "./hooks/useAgendaState";
import { useAgendaTasks } from "./hooks/useAgendaTasks";
import { useAgendaFilters } from "./hooks/useAgendaFilters";
import { useAgendaNavigation } from "./hooks/useAgendaNavigation";
import { AgendaHeader } from "./components/AgendaHeader/AgendaHeader";
import { AgendaControls } from "./components/AgendaControls/AgendaControls";
import { AgendaContent } from "./components/AgendaContent/AgendaContent";
import { AgendaFloatingButton } from "./components/AgendaFloatingButton";

export const TodoListAgendaContainer = ({
  onRefresh,
  refreshKey = 0,
  updateTaskDate,
  isMobile: initialIsMobile = false,
  initialSelectedObjectId = null,
}: TodoListAgendaProps) => {
  const agendaRef = useRef<HTMLDivElement>(null);
  const { showLoader, hideLoader } = useLoadingSystem();

  // Hooks custom
  const {
    state,
    dimensions,
    toggleExpanded,
    toggleViewMode,
    closeAgenda,
    toggleFiltersPanel,
    setRefreshing,
  } = useAgendaState(initialIsMobile);

  const { tasks, objects, selectedObjectId, isLoading, changeObject } =
    useAgendaTasks(initialSelectedObjectId, refreshKey);

  const {
    navigateToTask: navToTask,
    triggerHapticFeedback,
    currentUserId,
  } = useAgendaNavigation(dimensions.isMobile, closeAgenda);

  const {
    filters,
    filteredTasks,
    availableArticles,
    assignableUsers,
    updateFilter,
    clearSearchTerm,
  } = useAgendaFilters(tasks, currentUserId);

  // Animation spring pour la hauteur
  const springHeight = useSpring(state.agendaHeight, {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    springHeight.set(state.agendaHeight);
  }, [state.agendaHeight, springHeight]);

  // Gestion du body lors de l'expansion
  useEffect(() => {
    if (state.isExpanded) {
      document.body.setAttribute("data-agenda-expanded", "true");
    } else {
      document.body.removeAttribute("data-agenda-expanded");
    }

    return () => {
      document.body.removeAttribute("data-agenda-expanded");
    };
  }, [state.isExpanded]);

  // Ajustements PWA
  useEffect(() => {
    if (dimensions.isMobile && dimensions.isPWA) {
      document.body.style.paddingBottom = `${dimensions.minHeight}px`;

      if (agendaRef.current) {
        agendaRef.current.style.bottom = "0";
        agendaRef.current.style.paddingBottom =
          "env(safe-area-inset-bottom, 0px)";
      }
    } else {
      document.body.style.paddingBottom = "";
      if (agendaRef.current) {
        agendaRef.current.style.bottom = "0";
      }
    }

    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [dimensions.isMobile, dimensions.isPWA, dimensions.minHeight]);

  // Empêcher le scroll de la page quand l'agenda est ouvert sur mobile
  useEffect(() => {
    if (!dimensions.isMobile || !state.isExpanded) return;

    const blockTouchEvents = (e: TouchEvent) => {
      if (agendaRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("touchstart", blockTouchEvents, {
      passive: false,
    });
    document.addEventListener("touchmove", blockTouchEvents, {
      passive: false,
    });
    document.addEventListener("touchend", blockTouchEvents, { passive: false });

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener("touchstart", blockTouchEvents);
      document.removeEventListener("touchmove", blockTouchEvents);
      document.removeEventListener("touchend", blockTouchEvents);
    };
  }, [dimensions.isMobile, state.isExpanded]);

  // Handler pour le rafraîchissement manuel
  const handleManualRefresh = useCallback(async () => {
    if (!onRefresh || state.isRefreshingLocal) return;

    setRefreshing(true);

    const loaderId = showLoader({
      message: "Rafraîchissement de l'agenda...",
      source: "agendaRefresh",
      priority: 10,
      skipDelay: true,
    });

    try {
      await onRefresh();
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    } finally {
      hideLoader(loaderId);
      setRefreshing(false);
    }
  }, [
    onRefresh,
    state.isRefreshingLocal,
    setRefreshing,
    showLoader,
    hideLoader,
  ]);

  // Navigation vers une tâche
  const handleTaskClick = useCallback(
    async (task: Task) => {
      triggerHapticFeedback();
      await navToTask(task);
    },
    [navToTask, triggerHapticFeedback]
  );

  // Toggle avec feedback haptique
  const handleToggleExpanded = useCallback(() => {
    triggerHapticFeedback();
    toggleExpanded();
  }, [triggerHapticFeedback, toggleExpanded]);

  const handleToggleViewMode = useCallback(() => {
    triggerHapticFeedback();
    toggleViewMode();
  }, [triggerHapticFeedback, toggleViewMode]);

  const handleCloseAgenda = useCallback(() => {
    triggerHapticFeedback();
    closeAgenda();
  }, [triggerHapticFeedback, closeAgenda]);

  const thisWeekEnd = getThisWeekEnd();
  const objectName =
    objects.find((obj) => obj.id === selectedObjectId)?.nom || "Objet";
  const taskCount = filteredTasks.length;

  return (
    <>
      <motion.div
        ref={agendaRef}
        className={`fixed bottom-0 left-0 right-0 bg-background shadow-lg print:shadow-none print:relative print:h-auto border-t border-border rounded-t-xl overflow-hidden z-40 ${
          state.isExpanded ? "expanded touch-none" : ""
        }`}
        style={{
          height: springHeight,
          position: "fixed",
          zIndex: 999,
        }}
        initial={false}
        animate={{
          height: state.agendaHeight,
          boxShadow: state.isExpanded
            ? "0 -4px 20px rgba(0,0,0,0.15)"
            : "0 -2px 10px rgba(0,0,0,0.1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        data-todo-list-agenda
      >
        <AgendaHeader
          isMobile={dimensions.isMobile}
          objects={objects}
          selectedObjectId={selectedObjectId}
          onObjectChange={changeObject}
          onToggle={handleToggleExpanded}
          onClose={handleCloseAgenda}
          isExpanded={state.isExpanded}
          taskCount={taskCount}
          tasks={tasks}
          filteredTasks={filteredTasks}
          objectName={objectName}
          searchTerm={filters.searchTerm}
          statusFilter={filters.statusFilter}
          articleFilter={filters.articleFilter}
          availableArticles={availableArticles}
          thisWeekEnd={thisWeekEnd}
        />

        <AgendaControls
          isExpanded={state.isExpanded}
          showControls={state.showControls}
          showFiltersPanel={state.showFiltersPanel}
          viewMode={state.viewMode}
          filters={filters}
          assignableUsers={assignableUsers}
          availableArticles={availableArticles}
          isMobile={dimensions.isMobile}
          showDragHint={state.showDragHint}
          isRefreshing={state.isRefreshingLocal}
          updateTaskDate={updateTaskDate}
          onViewModeToggle={handleToggleViewMode}
          onFilterChange={updateFilter}
          onClearSearch={clearSearchTerm}
          onToggleFiltersPanel={toggleFiltersPanel}
          onRefresh={handleManualRefresh}
        />

        <AgendaContent
          viewMode={state.viewMode}
          tasks={filteredTasks}
          filters={filters}
          isLoading={isLoading}
          isMobile={dimensions.isMobile}
          refreshKey={refreshKey}
          updateTaskDate={updateTaskDate}
          onTaskClick={handleTaskClick}
          showControls={state.showControls}
          showFiltersPanel={state.showFiltersPanel}
        />
      </motion.div>

      <AgendaFloatingButton
        isExpanded={state.isExpanded}
        isMobile={dimensions.isMobile}
        onToggle={handleToggleExpanded}
      />

      {/* Overlay pour mobile PWA */}
      {state.isExpanded && dimensions.isMobile && dimensions.isPWA && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseAgenda}
          style={{ touchAction: "none" }}
        />
      )}
    </>
  );
};
