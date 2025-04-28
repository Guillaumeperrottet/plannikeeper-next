"use client";

import dynamic from "next/dynamic";

// Import dynamique du composant TodoListAgenda
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});

// Import dynamique du composant CalendarView
const CalendarView = dynamic(() => import("./CalendarView"), {
  ssr: false,
});

export default function TodoListAgendaWrapper() {
  return <TodoListAgenda />;
}
