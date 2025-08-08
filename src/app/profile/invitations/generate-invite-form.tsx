"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  InvitationFormData,
  OrganizationObject,
} from "@/types/invitation";

export default function GenerateInviteForm({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const [role, setRole] = useState<"member" | "admin">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objects, setObjects] = useState<OrganizationObject[]>([]);
  const [objectPermissions, setObjectPermissions] = useState<
    Record<string, string>
  >({});
  const router = useRouter();

  // Éviter les warnings ESLint pour organizationId et userId qui ne sont pas utilisés directement
  // mais sont passés via les props pour une utilisation future
  console.debug("Form initialized for org:", organizationId, "user:", userId);

  // Charger les objets de l'organisation
  useEffect(() => {
    const fetchObjects = async () => {
      setIsLoadingObjects(true);
      try {
        const response = await fetch("/api/organization/objects");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des objets");
        }
        const data = await response.json();
        setObjects(data.objects || []);

        // Initialiser toutes les permissions à "none" pour les membres
        if (role === "member") {
          const initialPermissions: Record<string, string> = {};
          data.objects?.forEach((obj: OrganizationObject) => {
            initialPermissions[obj.id] = "none";
          });
          setObjectPermissions(initialPermissions);
        }
      } catch (err) {
        console.error("Error fetching objects:", err);
        setError("Erreur lors du chargement des objets");
      } finally {
        setIsLoadingObjects(false);
      }
    };

    fetchObjects();
  }, [role]);

  // Réinitialiser les permissions quand le rôle change
  useEffect(() => {
    if (role === "admin") {
      setObjectPermissions({});
    } else if (role === "member" && objects.length > 0) {
      setObjectPermissions((prev) => {
        const initialPermissions: Record<string, string> = {};
        objects.forEach((obj) => {
          initialPermissions[obj.id] = prev[obj.id] || "none";
        });
        return initialPermissions;
      });
    }
  }, [role, objects]);

  const handlePermissionChange = useCallback(
    (objectId: string, permission: string) => {
      setObjectPermissions((prev) => ({
        ...prev,
        [objectId]: permission,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation pour les membres
      if (role === "member") {
        const hasAccess = Object.values(objectPermissions).some(
          (permission) => permission !== "none"
        );
        if (!hasAccess) {
          throw new Error("Un membre doit avoir accès à au moins un objet");
        }
      }

      const formData: InvitationFormData = {
        role,
        objectPermissions: role === "member" ? objectPermissions : undefined,
      };

      const response = await fetch("/api/invitations/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      router.refresh(); // Pour rafraîchir la liste des codes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="invitation-form-container" data-invitation-form>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="invitation-form space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-foreground"
          >
            Rôle
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              e.stopPropagation();
              setRole(e.target.value as "member" | "admin");
            }}
            onFocus={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground border-input focus:ring-2 focus:ring-ring focus:ring-opacity-50 focus:border-transparent transition-colors"
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        {role === "member" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-foreground">
                Permissions d&apos;accès aux objets
              </h4>
              <div className="h-px bg-border flex-1" />
            </div>

            {isLoadingObjects ? (
              <div className="text-sm text-muted-foreground p-4 text-center">
                Chargement des objets...
              </div>
            ) : objects.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25">
                Aucun objet trouvé dans l&apos;organisation.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {objects.filter(
                  (object) =>
                    (objectPermissions[object.id] || "none") !== "none"
                ).length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-sm text-muted-foreground mb-3">
                      Aucun objet sélectionné
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      Choisissez les objets auxquels ce membre aura accès
                      ci-dessous
                    </div>
                  </div>
                ) : (
                  objects
                    .filter(
                      (object) =>
                        (objectPermissions[object.id] || "none") !== "none"
                    )
                    .map((object) => (
                      <div
                        key={object.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {object.nom}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {object.adresse} • {object.secteur}
                          </div>
                        </div>
                        <select
                          value={objectPermissions[object.id] || "none"}
                          onChange={(e) => {
                            e.stopPropagation();
                            handlePermissionChange(object.id, e.target.value);
                          }}
                          onFocus={(e) => e.stopPropagation()}
                          className="ml-4 px-2 py-1 text-sm border rounded bg-background text-foreground border-input focus:ring-2 focus:ring-ring focus:ring-opacity-50 focus:border-transparent transition-colors"
                        >
                          <option value="none">Aucun accès</option>
                          <option value="read">Lecture</option>
                          <option value="write">Modification</option>
                          <option value="admin">Administration</option>
                        </select>
                      </div>
                    ))
                )}

                {/* Section pour ajouter des objets */}
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Ajouter l&apos;accès à d&apos;autres objets :
                  </div>
                  <div className="space-y-2">
                    {objects
                      .filter(
                        (object) =>
                          (objectPermissions[object.id] || "none") === "none"
                      )
                      .map((object) => (
                        <div
                          key={object.id}
                          className="flex items-center justify-between p-3 border border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-muted-foreground truncate">
                              {object.nom}
                            </div>
                            <div className="text-xs text-muted-foreground/70 truncate">
                              {object.adresse} • {object.secteur}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={objectPermissions[object.id] || "none"}
                              onChange={(e) => {
                                setObjectPermissions((prev) => ({
                                  ...prev,
                                  [object.id]: e.target.value,
                                }));
                              }}
                              className="px-2 py-1 text-xs border rounded bg-background text-foreground border-input"
                            >
                              <option value="none">Aucun accès</option>
                              <option value="read">Lecture</option>
                              <option value="write">Écriture</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {role === "member" && objects.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 border border-dashed border-muted-foreground/25">
                <div className="text-xs text-muted-foreground">
                  <strong>Résumé des accès :</strong>{" "}
                  {
                    Object.values(objectPermissions).filter((p) => p !== "none")
                      .length
                  }{" "}
                  objet(s) avec accès
                </div>
              </div>
            )}
          </div>
        )}

        {role === "admin" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Administrateur :</strong> Accès complet à tous les objets
              de l&apos;organisation.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            Les codes d&apos;invitation expirent automatiquement après 7 jours
          </div>
          <button
            type="submit"
            disabled={isLoading || isLoadingObjects}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Génération..." : "Générer un code"}
          </button>
        </div>
      </form>
    </div>
  );
}
