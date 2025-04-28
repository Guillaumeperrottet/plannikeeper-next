"use client";

import dynamic from "next/dynamic";

// Import dynamique du composant TodoListAgenda
const TodoListAgenda = dynamic(() => import("./TodoListAgenda"), {
  ssr: false,
});

export default function TodoListAgendaWrapper() {
  return <TodoListAgenda />;
}
