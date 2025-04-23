"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Objet {
  id: string;
  nom: string;
  adresse: string;
  secteur: string;
}

interface ObjectAccess {
  userId: string;
  objectId: string;
  accessLevel: string; // "read", "write", "admin"
}

export function ObjectAccessManager({
  userId,
  objects,
  organizationId,
}: {
  userId: string;
  objects: Objet[];
  organizationId: string;
}) {
  const [objectAccess, setObjectAccess] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

          setObjectAccess(accessMap);
        } else {
          // Si aucun accès n'est trouvé, nous supposons que tous les objets sont accessibles
          const allAccess: Record<string, string> = {};
          objects.forEach((obj) => {
            allAccess[obj.id] = "read"; // Accès en lecture par défaut
          });
          setObjectAccess(allAccess);
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
  }, [userId, objects]);

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

  if (isLoading) {
    return <div>Chargement des accès...</div>;
  }

  if (objects.length === 0) {
    return <div>Aucun objet trouvé dans cette organisation.</div>;
  }

  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Objet</th>
              <th className="p-2 text-left">Adresse</th>
              <th className="p-2 text-left">Secteur</th>
              <th className="p-2 text-left">Niveau d&apos;accès</th>
            </tr>
          </thead>
          <tbody>
            {objects.map((object) => (
              <tr key={object.id} className="border-t">
                <td className="p-2">{object.nom}</td>
                <td className="p-2">{object.adresse}</td>
                <td className="p-2">{object.secteur}</td>
                <td className="p-2">
                  <select
                    value={objectAccess[object.id] || "none"}
                    onChange={(e) =>
                      handleAccessChange(object.id, e.target.value)
                    }
                    className="p-1 border rounded"
                  >
                    <option value="none">Aucun accès</option>
                    <option value="read">Lecture</option>
                    <option value="write">Modification</option>
                    <option value="admin">Administration</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={saveAllAccess}
        disabled={isSaving}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? "Enregistrement..." : "Enregistrer les accès"}
      </button>
    </div>
  );
}
