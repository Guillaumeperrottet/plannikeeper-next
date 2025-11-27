"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { PREDEFINED_TASK_TYPES } from "../../lib/taskHelpers";

interface TaskTypeSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}

export function TaskTypeSelector({
  value,
  onChange,
  className = "",
}: TaskTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customTaskTypes, setCustomTaskTypes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadCustomTaskTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks/types");
      if (response.ok) {
        const data = await response.json();
        setCustomTaskTypes(data.types || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types de tâches:", error);
    }
  }, []);

  useEffect(() => {
    loadCustomTaskTypes();
  }, [loadCustomTaskTypes]);

  useEffect(() => {
    if (open) {
      loadCustomTaskTypes();
    }
  }, [open, loadCustomTaskTypes]);

  const allTaskTypes = useMemo(() => {
    return [
      ...PREDEFINED_TASK_TYPES,
      ...customTaskTypes.filter(
        (type) => !PREDEFINED_TASK_TYPES.includes(type)
      ),
    ];
  }, [customTaskTypes]);

  useEffect(() => {
    if (value && !allTaskTypes.includes(value)) {
      setCustomMode(true);
      setSearchTerm(value);
    }
  }, [value, allTaskTypes]);

  const filteredTypes = searchTerm
    ? allTaskTypes.filter((type) =>
        type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allTaskTypes;

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center justify-between w-full px-3 py-2 border border-input rounded-lg cursor-pointer bg-background hover:bg-accent/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {!customMode ? (
          <span className="text-sm text-foreground">
            {value || "Sélectionner un type"}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onChange(e.target.value);
            }}
            onBlur={() => setOpen(false)}
            placeholder="Saisir un type personnalisé"
            className="w-full bg-transparent outline-none text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </div>

      {open && !customMode && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher ou créer..."
              className="w-full px-3 py-2 text-sm border border-input rounded-md"
              autoFocus
            />
          </div>

          <div className="py-1">
            {filteredTypes.map((type) => (
              <div
                key={type}
                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                  setSearchTerm("");
                }}
              >
                <span>{type}</span>
                {value === type && <Check className="h-4 w-4" />}
              </div>
            ))}

            {searchTerm &&
              !filteredTypes.some(
                (type) => type.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <div
                  className="px-3 py-2 text-sm hover:bg-accent cursor-pointer text-primary font-medium"
                  onClick={() => {
                    onChange(searchTerm);
                    setOpen(false);
                    setSearchTerm("");
                  }}
                >
                  Créer &quot;{searchTerm}&quot;
                </div>
              )}

            <div className="border-t border-border mt-1 pt-1">
              <div
                className="px-3 py-2 text-sm hover:bg-accent cursor-pointer text-muted-foreground"
                onClick={() => {
                  setCustomMode(true);
                  setOpen(false);
                  setTimeout(() => {
                    setOpen(true);
                    inputRef.current?.focus();
                  }, 10);
                }}
              >
                ✏️ Mode personnalisé
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
