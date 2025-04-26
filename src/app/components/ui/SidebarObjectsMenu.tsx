// src/app/components/ui/SidebarObjectsMenu.tsx
"use client";

import { useState, useEffect } from "react";
import { SidebarLink } from "@/app/components/ui/sidebar";
import { useSidebar } from "@/app/components/ui/sidebar";
import {
  IconFolder,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Objet = {
  id: string;
  nom: string;
};

export function SidebarObjectsMenu({ isActive }: { isActive: boolean }) {
  const [objects, setObjects] = useState<Objet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { open: sidebarOpen } = useSidebar();

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/objet");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des objets");
        }
        const data = await response.json();
        setObjects(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
        console.error("Erreur:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, []);

  return (
    <div>
      {/* Menu principal des objets */}
      <div
        className={`flex items-center gap-2 py-2 px-2 my-1 rounded-lg transition-colors duration-200 cursor-pointer ${
          isActive
            ? "bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-accent-foreground)]"
            : "text-[color:var(--sidebar-foreground)] hover:bg-[color:var(--sidebar-accent)] hover:bg-opacity-50 hover:text-[color:var(--sidebar-accent-foreground)]"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-lg min-w-[20px] flex-shrink-0">
          <IconFolder stroke={1.5} />
        </div>
        <motion.span
          animate={{
            display: sidebarOpen ? "inline-block" : "none",
            opacity: sidebarOpen ? 1 : 0,
          }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
        >
          Objets
        </motion.span>
        <motion.span
          animate={{
            display: sidebarOpen ? "inline-block" : "none",
            opacity: sidebarOpen ? 1 : 0,
          }}
        >
          {isOpen ? (
            <IconChevronDown size={16} />
          ) : (
            <IconChevronRight size={16} />
          )}
        </motion.span>
      </div>

      {/* Sous-menu des objets */}
      <AnimatePresence>
        {isOpen && sidebarOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4"
          >
            {isLoading ? (
              <div className="py-2 px-2 text-sm text-[color:var(--sidebar-foreground)] opacity-70">
                Chargement...
              </div>
            ) : error ? (
              <div className="py-2 px-2 text-sm text-red-500">
                Erreur: {error}
              </div>
            ) : objects.length === 0 ? (
              <div className="py-2 px-2 text-sm text-[color:var(--sidebar-foreground)] opacity-70">
                Aucun objet trouvé
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto">
                {objects.map((obj) => (
                  <Link
                    key={obj.id}
                    href={`/dashboard/objet/${obj.id}/view`}
                    className="flex items-center gap-2 py-1.5 px-2 my-0.5 rounded-lg hover:bg-[color:var(--sidebar-accent)] hover:bg-opacity-30 text-[color:var(--sidebar-foreground)] text-sm"
                  >
                    <span className="truncate">{obj.nom}</span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
