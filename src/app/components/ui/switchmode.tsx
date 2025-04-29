import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const Switch = () => {
  const [dark, setDark] = useState(false);

  // Vérifier le thème au chargement
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <label className="theme-switch relative inline-flex cursor-pointer select-none items-center">
      <input
        type="checkbox"
        checked={dark}
        onChange={() => setDark((v) => !v)}
        className="sr-only"
        aria-label="Activer le mode sombre"
      />

      <div
        className={`
        flex h-[32px] w-[60px] items-center rounded-full p-1 px-[3px] duration-300
        ${dark ? "bg-blue-800" : "bg-blue-400"}
      `}
      >
        <span
          className={`
          flex h-[26px] w-[26px] items-center justify-center rounded-full 
          bg-white shadow-switch transform duration-300
          ${dark ? "translate-x-[28px]" : "translate-x-0"}
        `}
        >
          {dark ? (
            <Moon className="h-4 w-4 text-blue-800" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}
        </span>
      </div>
    </label>
  );
};

export default Switch;
