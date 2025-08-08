"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Search, EyeIcon, Pencil, Lock, Save, X, Loader2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";

interface Objet {
  id: string;
  nom: string;
  adresse: string;
  secteur: string;
}

interface ObjectAccess {
  userId: string;
  objectId: string;
  accessLevel: string; // "none", "read", "write", "admin"
}

const ACCESS_LEVELS = [
  {
    value: "none",
    label: "Aucun accès",
    icon: Lock,
    color: "text-[color:var(--destructive)]",
  },
  {
    value: "read",
    label: "Lecture",
    icon: EyeIcon,
    color: "text-[color:var(--muted-foreground)]",
  },
  {
    value: "write",
    label: "Modification",
    icon: Pencil,
    color: "text-[color:var(--primary)]",
  },
  {
    value: "admin",
    label: "Administration",
    icon: Lock,
    color: "text-[color:var(--secondary)]",
  },
];

export function ObjectAccessManager({
  userId,
  objects,
  organizationId,
  isTargetUserAdmin = false,
}: {
  userId: string;
  objects: Objet[];
  organizationId: string;
  isTargetUserAdmin?: boolean;
}) {
  const [objectAccess, setObjectAccess] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalAccess, setOriginalAccess] = useState<Record<string, string>>(
    {}
  );

  // Filtrer les objets en fonction de la recherche
  const filteredObjects = objects.filter(
    (obj) =>
      obj.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.adresse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.secteur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Charger les accès actuels
  useEffect(() => {
    const loadAccess = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/object-access`);
        if (response.ok) {
          const data = await response.json();

          // Transformer la liste d'accès en un objet de mapping objectId -> accessLevel
          const accessMap: Record<string, string> = {};
          data.access.forEach((access: ObjectAccess) => {
            accessMap[access.objectId] = access.accessLevel;
          });

          // Définir une valeur par défaut pour tous les objets
          const allAccess: Record<string, string> = {};
          objects.forEach((obj) => {
            // Si l'utilisateur est admin, définir "admin" par défaut, sinon "none"
            const defaultAccess = isTargetUserAdmin ? "admin" : "none";
            allAccess[obj.id] = accessMap[obj.id] || defaultAccess;
          });

          setObjectAccess(allAccess);
          setOriginalAccess({ ...allAccess });
        } else {
          // Si aucun accès n'est trouvé, nous supposons qu'aucun accès n'est défini
          const defaultAccess: Record<string, string> = {};
          objects.forEach((obj) => {
            // Si l'utilisateur est admin, définir "admin" par défaut, sinon "none"
            defaultAccess[obj.id] = isTargetUserAdmin ? "admin" : "none";
          });
          setObjectAccess(defaultAccess);
          setOriginalAccess({ ...defaultAccess });
        }
      } catch (error) {
        toast.error(
          `Erreur lors du chargement des accès: ${
            error instanceof Error ? error.message : "Une erreur est survenue"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAccess();
  }, [userId, objects, isTargetUserAdmin]);

  // Vérifier s'il y a des changements non enregistrés
  useEffect(() => {
    let changed = false;

    for (const objId in objectAccess) {
      if (objectAccess[objId] !== originalAccess[objId]) {
        changed = true;
        break;
      }
    }

    setHasChanges(changed);
  }, [objectAccess, originalAccess]);

  const handleAccessChange = (objectId: string, accessLevel: string) => {
    setObjectAccess((prev) => ({
      ...prev,
      [objectId]: accessLevel,
    }));
  };

  const saveAllAccess = async () => {
    setIsSaving(true);
    try {
      // Transformer l'objet de mapping en liste d'accès
      const accessList = Object.entries(objectAccess).map(
        ([objectId, accessLevel]) => ({
          objectId,
          accessLevel,
        })
      );

      const response = await fetch(`/api/users/${userId}/object-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          access: accessList,
        }),
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour des accès");
      }

      toast.success("Les accès ont été mis à jour avec succès");
      setOriginalAccess({ ...objectAccess });
      setHasChanges(false);
    } catch (error) {
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetChanges = () => {
    setObjectAccess({ ...originalAccess });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[color:var(--muted-foreground)]" />
        <span className="ml-2 text-[color:var(--muted-foreground)]">
          Chargement des accès...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Entête avec recherche et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Barre de recherche */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={16}
              className="text-[color:var(--muted-foreground)]"
            />
          </div>
          <Input
            type="text"
            placeholder="Rechercher un objet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-2 bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)]"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchQuery("")}
            >
              <X
                size={16}
                className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              />
            </button>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={resetChanges}
                disabled={isSaving}
                className="gap-2 border-[color:var(--border)] bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 text-[color:var(--foreground)]"
              >
                <X size={16} />
                <span>Annuler</span>
              </Button>
              <Button
                onClick={saveAllAccess}
                disabled={isSaving}
                size="sm"
                className="gap-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Enregistrer</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Affichage des objets sous forme de tableau (desktop) et cartes (mobile) */}
      <div className="mb-6">
        {/* Version desktop */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-[color:var(--border)]">
          <table className="w-full">
            <thead>
              <tr className="bg-[color:var(--muted)] border-b border-[color:var(--border)]">
                <th className="py-3 px-4 text-left text-sm font-medium text-[color:var(--muted-foreground)]">
                  Nom de l&apos;objet
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-[color:var(--muted-foreground)]">
                  Adresse
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-[color:var(--muted-foreground)]">
                  Secteur
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-[color:var(--muted-foreground)]">
                  Niveau d&apos;accès
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredObjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 px-4 text-center text-[color:var(--muted-foreground)]"
                  >
                    {searchQuery
                      ? "Aucun objet ne correspond à votre recherche"
                      : "Aucun objet trouvé"}
                  </td>
                </tr>
              ) : (
                filteredObjects.map((object) => (
                  <tr
                    key={object.id}
                    className="border-b border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                  >
                    <td className="py-3 px-4 text-[color:var(--foreground)]">
                      {object.nom}
                    </td>
                    <td className="py-3 px-4 text-[color:var(--muted-foreground)]">
                      {object.adresse}
                    </td>
                    <td className="py-3 px-4 text-[color:var(--muted-foreground)]">
                      {object.secteur}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={objectAccess[object.id] || "none"}
                        onChange={(e) =>
                          handleAccessChange(object.id, e.target.value)
                        }
                        className="w-full py-1.5 px-3 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-50"
                        disabled={isSaving}
                      >
                        {ACCESS_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Version mobile - Google 2025 */}
        <div className="md:hidden space-y-4">
          {filteredObjects.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Search size={20} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucun objet ne correspond à votre recherche"
                  : "Aucun objet trouvé"}
              </p>
            </div>
          ) : (
            filteredObjects.map((object) => {
              const currentAccess = objectAccess[object.id] || "none";
              const currentLevel = ACCESS_LEVELS.find(
                (l) => l.value === currentAccess
              );
              const CurrentIcon = currentLevel?.icon || Lock;

              return (
                <div
                  key={object.id}
                  className="group border border-border rounded-xl bg-card/50 backdrop-blur-sm p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {object.nom}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        📍 {object.adresse}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Secteur: {object.secteur}
                      </p>
                    </div>

                    {/* Indicateur d'accès actuel */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border">
                      <CurrentIcon
                        size={14}
                        className={
                          currentLevel?.color || "text-muted-foreground"
                        }
                      />
                      <span className="text-xs font-medium">
                        {currentLevel?.label || "Aucun"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-3 text-foreground">
                      Niveau d&apos;accès
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ACCESS_LEVELS.map((level) => {
                        const Icon = level.icon;
                        const isSelected = currentAccess === level.value;

                        return (
                          <button
                            key={level.value}
                            onClick={() =>
                              handleAccessChange(object.id, level.value)
                            }
                            disabled={isSaving}
                            className={`flex items-center gap-2 py-3 px-3 rounded-lg border transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                                : "border-border hover:bg-muted/50 hover:border-primary/30 text-foreground"
                            }`}
                          >
                            <Icon
                              size={16}
                              className={
                                isSelected ? "text-primary" : level.color
                              }
                            />
                            <span className="text-sm font-medium">
                              {level.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Légende des niveaux d'accès */}
      <div className="bg-[color:var(--muted)] p-4 rounded-lg border border-[color:var(--border)]">
        <h3 className="text-sm font-medium mb-3 text-[color:var(--foreground)]">
          Niveaux d&apos;accès
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {ACCESS_LEVELS.map((level) => {
            const Icon = level.icon;
            return (
              <div key={level.value} className="flex items-center gap-2">
                <Icon size={16} className={level.color} />
                <span className="text-sm text-[color:var(--foreground)]">
                  {level.label}:
                </span>
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  {level.value === "none" && "Aucun accès à l'objet"}
                  {level.value === "read" && "Peut voir l'objet et ses tâches"}
                  {level.value === "write" &&
                    "Peut modifier l'objet et gérer ses tâches"}
                  {level.value === "admin" &&
                    "Accès complet, peut supprimer l'objet"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bouton pour sauvegarder les changements (bottom) */}
      {hasChanges && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={saveAllAccess}
            disabled={isSaving}
            className="gap-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Enregistrer tous les changements</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
