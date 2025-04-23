"use client";

import { MapPin, Briefcase, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ObjetCardProps {
  objet: {
    id: string;
    nom: string;
    adresse: string;
    secteur: string;
  };
}

export default function ObjetCard({ objet }: ObjetCardProps) {
  // Fonction pour déterminer quelle icône utiliser selon le secteur
  const getSecteurIcon = (secteur: string) => {
    switch (secteur.toLowerCase()) {
      case "bureau":
        return "/window.svg";
      case "commercial":
        return "/globe.svg";
      default:
        return "/file.svg";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 relative">
      <Link href={`/dashboard/objet/${objet.id}/view`} className="block p-5">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-semibold text-gray-800 line-clamp-1">
            {objet.nom}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin size={16} />
          <span className="text-sm line-clamp-1">{objet.adresse}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Briefcase size={16} />
          <span className="text-sm">{objet.secteur}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image
                src={getSecteurIcon(objet.secteur)}
                alt={objet.secteur}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="text-xs text-gray-500 capitalize">
              {objet.secteur}
            </span>
          </div>
          <span className="text-xs text-blue-600 font-medium">
            Voir détails
          </span>
        </div>
      </Link>
      <Link
        href={`/dashboard/objet/${objet.id}/edit`}
        className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
        aria-label="Modifier cet objet"
      >
        <Edit size={16} />
      </Link>
    </div>
  );
}
