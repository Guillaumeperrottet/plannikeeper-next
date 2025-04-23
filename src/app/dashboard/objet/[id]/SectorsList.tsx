"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Edit, MapPin } from "lucide-react";

interface Sector {
  id: string;
  name: string;
  image: string | null;
  objectId: string;
}

interface SectorsListProps {
  sectors: Sector[];
  objectId: string;
  canEdit: boolean;
}

export default function SectorsList({
  sectors,
  objectId,
  canEdit,
}: SectorsListProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Secteurs</h2>
        {canEdit && !isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
            <span>Ajouter un secteur</span>
          </button>
        )}
      </div>

      {isAddingNew && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <NewSectorForm
            objectId={objectId}
            onCancel={() => setIsAddingNew(false)}
          />
        </div>
      )}

      {sectors.length === 0 && !isAddingNew ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border">
          <MapPin size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-3">
            Aucun secteur n&apos;a été ajouté à cet objet.
          </p>
          {canEdit && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ajouter un secteur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/dashboard/objet/${objectId}/secteur/${sector.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition bg-white"
            >
              <div className="aspect-video relative bg-gray-100">
                {sector.image ? (
                  <Image
                    src={sector.image}
                    alt={sector.name}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <MapPin size={40} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium">{sector.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-blue-600">Voir le plan</span>
                  {canEdit && (
                    <Link
                      href={`/dashboard/objet/${objectId}/secteur/${sector.id}/edit`}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewSectorForm({
  objectId,
  onCancel,
}: {
  objectId: string;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom du secteur est requis");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sectors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          image: imageUrl || null,
          objectId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      // Rechargement de la page pour afficher le nouveau secteur
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du secteur"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nom du secteur *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
          URL de l&apos;image (optionnel)
        </label>
        <input
          type="text"
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="https://exemple.com/image.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">
          Laissez vide pour utiliser une image par défaut
        </p>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Création..." : "Créer le secteur"}
        </button>
      </div>
    </form>
  );
}
