"use client";

import dynamic from "next/dynamic";

// Import dynamique des composants avec chargement différé
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-background border-t border-border animate-pulse"></div>
  ),
});

// Import dynamique des composants enfants
const CalendarView = dynamic(() => import("./CalendarView"), { ssr: false });
const TaskDetailPopup = dynamic(() => import("./TaskDetailPopup"), {
  ssr: false,
});
const CalendarMiniTask = dynamic(() => import("./CalendarMiniTask"), {
  ssr: false,
});
const CalendarHints = dynamic(() => import("./CalendarHints"), { ssr: false });

export default function TodoListAgendaWrapper() {
  return <TodoListAgenda />;
}
