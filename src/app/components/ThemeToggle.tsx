// Ajoute ce composant dans ton projet, par exemple dans src/app/components/ThemeToggle.tsx

"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
    >
      {dark ? "Mode clair" : "Mode sombre"}
    </button>
  );
}
