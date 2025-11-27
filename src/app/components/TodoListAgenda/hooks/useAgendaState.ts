// Hook pour gérer l'état global de l'agenda
"use client";

import { useState, useEffect } from "react";
import { AgendaState, ViewMode, AgendaDimensions } from "../types";

const MIN_HEIGHT = 48;

export const useAgendaState = (isMobile: boolean = false) => {
  const [state, setState] = useState<AgendaState>({
    isExpanded: false,
    agendaHeight: MIN_HEIGHT,
    viewMode: ViewMode.LIST,
    showControls: false,
    showFiltersPanel: false,
    interactionLocked: false,
    showDragHint: false,
    isRefreshingLocal: false,
  });

  const [dimensions, setDimensions] = useState<AgendaDimensions>({
    minHeight: MIN_HEIGHT,
    maxHeight: 600,
    isPWA: false,
    isMobile,
  });

  // Détection du mode mobile et PWA
  useEffect(() => {
    const checkDimensions = () => {
      const isMobileView = window.innerWidth < 768;
      const maxHeight = window.innerHeight * (isMobileView ? 0.8 : 0.85);

      setDimensions((prev) => ({
        ...prev,
        isMobile: isMobileView,
        maxHeight,
      }));
    };

    const checkPWA = () => {
      const isPWAMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator &&
          (window.navigator as { standalone?: boolean }).standalone === true);

      setDimensions((prev) => ({ ...prev, isPWA: isPWAMode }));
    };

    checkDimensions();
    checkPWA();

    window.addEventListener("resize", checkDimensions);
    return () => window.removeEventListener("resize", checkDimensions);
  }, []);

  // Charger la préférence de vue depuis localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem("plannikeeper-view-mode");
    if (
      savedViewMode &&
      Object.values(ViewMode).includes(savedViewMode as ViewMode)
    ) {
      setState((prev) => ({ ...prev, viewMode: savedViewMode as ViewMode }));
    }
  }, []);

  // Sauvegarder la préférence de vue dans localStorage
  useEffect(() => {
    localStorage.setItem("plannikeeper-view-mode", state.viewMode);
  }, [state.viewMode]);

  // Gestion de l'expansion/collapse
  useEffect(() => {
    if (state.isExpanded) {
      setState((prev) => ({ ...prev, interactionLocked: true }));

      const showControlsTimer = setTimeout(() => {
        setState((prev) => ({ ...prev, showControls: true }));
      }, 150);

      const unlockTimer = setTimeout(() => {
        setState((prev) => ({ ...prev, interactionLocked: false }));
      }, 300);

      return () => {
        clearTimeout(showControlsTimer);
        clearTimeout(unlockTimer);
      };
    } else {
      setState((prev) => ({
        ...prev,
        showControls: false,
        showFiltersPanel: false,
      }));
    }
  }, [state.isExpanded]);

  // Hint drag and drop
  useEffect(() => {
    if (state.viewMode === ViewMode.CALENDAR && !dimensions.isMobile) {
      setState((prev) => ({ ...prev, showDragHint: true }));

      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, showDragHint: false }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.viewMode, dimensions.isMobile]);

  const toggleExpanded = () => {
    if (state.interactionLocked) return;

    setState((prev) => ({
      ...prev,
      isExpanded: !prev.isExpanded,
      agendaHeight: !prev.isExpanded ? dimensions.maxHeight : MIN_HEIGHT,
    }));
  };

  const toggleViewMode = () => {
    setState((prev) => ({
      ...prev,
      viewMode:
        prev.viewMode === ViewMode.LIST ? ViewMode.CALENDAR : ViewMode.LIST,
    }));
  };

  const closeAgenda = () => {
    setState((prev) => ({
      ...prev,
      isExpanded: false,
      agendaHeight: MIN_HEIGHT,
    }));
  };

  const toggleFiltersPanel = () => {
    setState((prev) => ({
      ...prev,
      showFiltersPanel: !prev.showFiltersPanel,
    }));
  };

  const setRefreshing = (isRefreshing: boolean) => {
    setState((prev) => ({ ...prev, isRefreshingLocal: isRefreshing }));
  };

  return {
    state,
    dimensions,
    toggleExpanded,
    toggleViewMode,
    closeAgenda,
    toggleFiltersPanel,
    setRefreshing,
  };
};
