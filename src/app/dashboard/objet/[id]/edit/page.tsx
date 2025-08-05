import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import DeleteObjectButton from "@/app/dashboard/objet/[id]/edit/delete-object-button";
import EditableField from "@/app/components/ui/EditableField";
import EditableIconField from "@/app/components/ui/EditableIconField";
import EditableCountryField from "@/app/components/ui/EditableCountryField";
import SectorCard from "./sector-card";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default async function EditObjetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  const { id: objetId } = await params;

  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
    include: {
      organization: true,
      sectors: {
        include: {
          articles: true,
        },
      },
    },
  });

  if (!objet) {
    redirect("/dashboard");
  }

  interface SessionWithMetadata {
    metadata?: {
      role?: string;
    };
    organizationId?: string;
  }

  const isAdmin =
    (session as unknown as SessionWithMetadata).metadata?.role ===
      "SUPER_ADMIN" || objet.organization.id === session.organizationId;

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation moderne */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {objet.nom}
                </h1>
                <p className="text-sm text-slate-500">
                  {objet.organization.name}
                </p>
              </div>
            </div>
            {isAdmin && (
              <DeleteObjectButton objetId={objetId} objetName={objet.nom} />
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Informations générales */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Nom
                  </Label>
                  <EditableField
                    initialValue={objet.nom}
                    fieldName="nom"
                    label="Nom"
                    objectId={objetId}
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Adresse
                  </Label>
                  <EditableField
                    initialValue={objet.adresse}
                    fieldName="adresse"
                    label="Adresse"
                    objectId={objetId}
                  />
                </div>

                {/* Pays */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Pays
                  </Label>
                  <EditableCountryField
                    initialValue={objet.pays}
                    objectId={objetId}
                  />
                </div>

                {/* Activité */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Activité
                  </Label>
                  <EditableField
                    initialValue={objet.secteur}
                    fieldName="secteur"
                    label="Activité"
                    objectId={objetId}
                  />
                </div>

                {/* Icône */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Icône
                  </Label>
                  <EditableIconField
                    initialValue={objet.icon}
                    objectId={objetId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secteurs */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Secteurs
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                    {objet.sectors.length}
                  </span>
                </CardTitle>
                <Link href={`/dashboard/objet/${objetId}/secteur/new`}>
                  <Button size="sm" className="shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau secteur
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {objet.sectors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">
                    Aucun secteur
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Commencez par créer votre premier secteur pour organiser
                    votre objet
                  </p>
                  <Link href={`/dashboard/objet/${objetId}/secteur/new`}>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un secteur
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {objet.sectors.map((sector) => (
                    <SectorCard
                      key={sector.id}
                      sector={sector}
                      objetId={objetId}
                      isAdmin={!!isAdmin}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
