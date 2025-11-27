// Migration utility - Backward compatibility
// This file helps maintain compatibility while transitioning to the new architecture

export const LEGACY_FILES = {
  "tasks-page-table.tsx": "Replaced by components/TaskList/*",
  "task-form.tsx": "Replaced by components/TaskForm/TaskForm.tsx",
  "TaskFormMobileOptimized.tsx":
    "Replaced by components/TaskForm/TaskForm.tsx (responsive)",
  // task-detail-page.tsx still in use, will be refactored next
};

export const NEW_ARCHITECTURE = {
  "TasksPageClient.tsx": "Main client entry point",
  "components/TaskList/": "List view components",
  "components/TaskForm/": "Unified form component",
  "components/shared/": "Reusable components",
  "hooks/": "Custom hooks for business logic",
  "lib/": "Types and utilities",
};

// Note: Les anciens fichiers peuvent être supprimés après validation complète
// Recommendation: Garder une sauvegarde pendant 1 sprint avant suppression définitive
