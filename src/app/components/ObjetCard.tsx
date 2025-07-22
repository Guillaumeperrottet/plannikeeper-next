"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import Editbutton from "./ui/edit-button";
import { useRouter } from "@/lib/router-helper";
import ObjectIcon from "./ui/ObjectIcon";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ObjetCardProps {
  objet: {
    id: string;
    nom: string;
    adresse: string;
    pays: string;
    secteur: string;
    icon?: string | null;
  };
}

export default function ObjetCard({ objet }: ObjetCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.navigateWithLoading(`/dashboard/objet/${objet.id}/view`, {
      loadingMessage: `Chargement de ${objet.nom}...`,
      hapticFeedback: true,
    });
  };

  return (
    <Card
      className="hover:border-[#d9840c] hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold line-clamp-1 group-hover:text-[#d9840c] transition-colors">
            {objet.nom}
          </CardTitle>

          {/* Arrêt de la propagation pour que seul ce lien réagisse */}
          <Link
            href={`/dashboard/objet/${objet.id}/edit`}
            onClick={(e) => e.stopPropagation()}
          >
            <Editbutton aria-label="Modifier cet objet" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-start gap-2 text-muted-foreground mb-4">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div>{objet.adresse}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {objet.pays}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ObjectIcon
              iconKey={objet.icon || "building"}
              size={24}
              className="text-muted-foreground group-hover:text-[#d9840c] transition-colors"
            />
            <span className="text-xs text-muted-foreground capitalize">
              {objet.secteur}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
