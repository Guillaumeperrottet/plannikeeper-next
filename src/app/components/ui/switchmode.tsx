// switchmode.tsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// 1) On définit les props qu’on va accepter :
interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  // on récupère les props, avec des valeurs par défaut
  checked: controlledChecked,
  onCheckedChange,
  disabled = false,
}) => {
  // on garde la logique « dark mode » en non-contrôlé
  const [dark, setDark] = useState(false);

  // est-ce qu’on est contrôlé (prop checked + callback) ?
  const isControlled = controlledChecked !== undefined && !!onCheckedChange;
  // valeur courante du toggle
  const isDark = isControlled ? controlledChecked! : dark;

  // init only if uncontrolled
  useEffect(() => {
    if (!isControlled) {
      const savedTheme = localStorage.getItem("theme");
      if (
        savedTheme === "dark" ||
        (!savedTheme &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        setDark(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, [isControlled]);

  // sync only if uncontrolled
  useEffect(() => {
    if (!isControlled) {
      if (dark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, [dark, isControlled]);

  // handler qui bascule soit l’état controllé, soit le state interne
  const handleChange = () => {
    if (disabled) return;
    if (isControlled) {
      onCheckedChange!(!controlledChecked!);
    } else {
      setDark((v) => !v);
    }
  };

  return (
    <label className="theme-switch relative inline-flex cursor-pointer select-none items-center">
      <input
        type="checkbox"
        checked={isDark}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
        aria-label="Activer le mode sombre"
      />

      <div
        className={`
          flex h-[32px] w-[60px] items-center rounded-full p-1 px-[3px] duration-300
          ${isDark ? "bg-blue-800" : "bg-blue-400"}
        `}
      >
        <span
          className={`
            flex h-[26px] w-[26px] items-center justify-center rounded-full 
            bg-white shadow-switch transform duration-300
            ${isDark ? "translate-x-[28px]" : "translate-x-0"}
          `}
        >
          {isDark ? (
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
