"use client";

import { useState, useEffect } from "react";
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
      const initialPermissions: Record<string, string> = {};
      objects.forEach((obj) => {
        initialPermissions[obj.id] = objectPermissions[obj.id] || "none";
      });
      setObjectPermissions(initialPermissions);
    }
  }, [role, objects, objectPermissions]);

  const handlePermissionChange = (objectId: string, permission: string) => {
    setObjectPermissions((prev) => ({
      ...prev,
      [objectId]: permission,
    }));
  };

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
    <div className="p-4 border rounded-lg bg-[color:var(--card)] border-[color:var(--border)]">
      <h3 className="font-medium mb-3 text-[color:var(--foreground)]">
        Générer un nouveau code d&apos;invitation
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-[color:var(--destructive-background)] text-[color:var(--destructive)] rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="role"
            className="block mb-1 text-sm text-[color:var(--foreground)]"
          >
            Rôle
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "member" | "admin")}
            className="w-full px-3 py-2 border rounded bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)]"
          >
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        {role === "member" && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-[color:var(--foreground)]">
              Permissions d&apos;accès aux objets
            </h4>

            {isLoadingObjects ? (
              <div className="text-sm text-[color:var(--muted-foreground)]">
                Chargement des objets...
              </div>
            ) : objects.length === 0 ? (
              <div className="text-sm text-[color:var(--muted-foreground)]">
                Aucun objet trouvé dans l&apos;organisation.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {objects.map((object) => (
                  <div
                    key={object.id}
                    className="flex items-center justify-between p-3 border rounded bg-[color:var(--background)] border-[color:var(--border)]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[color:var(--foreground)]">
                        {object.nom}
                      </div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">
                        {object.adresse} • {object.secteur}
                      </div>
                    </div>
                    <select
                      value={objectPermissions[object.id] || "none"}
                      onChange={(e) =>
                        handlePermissionChange(object.id, e.target.value)
                      }
                      className="ml-3 px-2 py-1 text-sm border rounded bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)]"
                    >
                      <option value="none">Aucun accès</option>
                      <option value="read">Lecture</option>
                      <option value="write">Modification</option>
                      <option value="admin">Administration</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {role === "member" && objects.length > 0 && (
              <div className="text-xs text-[color:var(--muted-foreground)]">
                <strong>Résumé des accès :</strong>{" "}
                {
                  Object.values(objectPermissions).filter((p) => p !== "none")
                    .length
                }{" "}
                objet(s) avec accès
              </div>
            )}
          </div>
        )}

        {role === "admin" && (
          <div className="p-3 bg-[color:var(--muted)] rounded text-sm text-[color:var(--foreground)]">
            <strong>Administrateur :</strong> Accès complet à tous les objets de
            l&apos;organisation.
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading || isLoadingObjects}
            className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded hover:bg-[color:var(--primary)]/90 disabled:opacity-50"
          >
            {isLoading ? "Génération..." : "Générer un code"}
          </button>
        </div>
      </form>
    </div>
  );
}
