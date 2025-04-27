"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface SectorInput {
  name: string;
  image: File | null;
  imagePreview?: string;
}

export default function NewObjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [secteurPrincipal, setSecteurPrincipal] = useState("");
  const [sectors, setSectors] = useState<SectorInput[]>([
    { name: "", image: null },
  ]);

  const handleAddSector = () => {
    setSectors([...sectors, { name: "", image: null }]);
  };

  const handleRemoveSector = (index: number) => {
    const newSectors = [...sectors];
    newSectors.splice(index, 1);
    setSectors(newSectors);
  };

  const handleSectorNameChange = (index: number, name: string) => {
    const newSectors = [...sectors];
    newSectors[index].name = name;
    setSectors(newSectors);
  };

  const handleSectorImageChange = (index: number, file: File | null) => {
    const newSectors = [...sectors];
    newSectors[index].image = file;

    // Create preview URL
    if (file) {
      newSectors[index].imagePreview = URL.createObjectURL(file);
    } else {
      newSectors[index].imagePreview = undefined;
    }

    setSectors(newSectors);
  };

  const validateForm = (): boolean => {
    if (!nom.trim()) {
      toast.error("Le nom de l'objet est requis");
      return false;
    }

    if (!adresse.trim()) {
      toast.error("L'adresse est requise");
      return false;
    }

    if (!secteurPrincipal.trim()) {
      toast.error("Le secteur principal est requis");
      return false;
    }

    // Vérifier que tous les secteurs ont un nom et une image
    for (let i = 0; i < sectors.length; i++) {
      if (!sectors[i].name.trim()) {
        toast.error(`Le nom du secteur ${i + 1} est requis`);
        return false;
      }

      if (!sectors[i].image) {
        toast.error(`L'image du secteur ${i + 1} est requise`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Création de l'objet en cours...");

    try {
      // Créer un formData pour pouvoir envoyer les fichiers
      const formData = new FormData();
      formData.append("nom", nom);
      formData.append("adresse", adresse);
      formData.append("secteur", secteurPrincipal);

      // Ajouter les informations des secteurs
      formData.append("sectorsCount", sectors.length.toString());

      sectors.forEach((sector, index) => {
        formData.append(`sector_${index}_name`, sector.name);
        if (sector.image) {
          formData.append(`sector_${index}_image`, sector.image);
        }
      });

      // Envoyer la requête
      const response = await fetch("/api/objet/new-with-sectors", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Une erreur est survenue lors de la création de l'objet"
        );
      }

      const data = await response.json();

      toast.success("Objet créé avec succès!", { id: toastId });
      router.push(`/dashboard/objet/${data.id}/edit`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        `Erreur: ${
          error instanceof Error ? error.message : "Une erreur est survenue"
        }`,
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Créer un nouvel objet</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6"
      >
        <div className="grid gap-6 mb-8">
          <h2 className="text-xl font-semibold border-b border-[color:var(--border)] pb-2 text-[color:var(--foreground)]">
            Informations générales
          </h2>

          <div>
            <label
              htmlFor="nom"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Nom *
            </label>
            <Input
              type="text"
              id="nom"
              name="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de l'objet"
              required
            />
          </div>

          <div>
            <label
              htmlFor="adresse"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Adresse *
            </label>
            <Input
              type="text"
              id="adresse"
              name="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Adresse complète"
              required
            />
          </div>

          <div>
            <label
              htmlFor="secteur"
              className="block text-sm font-medium text-[color:var(--foreground)] mb-1"
            >
              Activité *
            </label>
            <Input
              type="text"
              id="secteur"
              name="secteur"
              value={secteurPrincipal}
              onChange={(e) => setSecteurPrincipal(e.target.value)}
              placeholder="Ex: Camping, Immobilier..."
              required
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold border-b pb-2">Secteurs</h2>
            <button
              type="button"
              onClick={handleAddSector}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </button>
          </div>

          {sectors.map((sector, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Secteur {index + 1}</h3>
                {sectors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSector(index)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash size={16} />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`sector-${index}-name`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nom du secteur *
                  </label>
                  <input
                    type="text"
                    id={`sector-${index}-name`}
                    value={sector.name}
                    onChange={(e) =>
                      handleSectorNameChange(index, e.target.value)
                    }
                    placeholder="Ex: Cuisine, Salle de bain..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor={`sector-${index}-image`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Image du secteur *
                  </label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor={`sector-${index}-image`}
                      className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                        sector.image
                          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10"
                          : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                      }`}
                    >
                      {sector.imagePreview ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={sector.imagePreview}
                            alt={`Preview ${sector.name}`}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-500" />
                          <p className="text-xs text-gray-500 mt-2">
                            Cliquez pour uploader
                          </p>
                        </div>
                      )}
                      <input
                        id={`sector-${index}-image`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleSectorImageChange(index, file);
                        }}
                        required
                      />
                    </label>
                    {sector.image && (
                      <button
                        type="button"
                        onClick={() => handleSectorImageChange(index, null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[color:var(--border)] mt-8">
          <Link href="/dashboard">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création en cours..." : "Créer l'objet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
