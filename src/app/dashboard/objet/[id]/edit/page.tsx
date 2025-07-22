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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";

export default async function ObjetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  const { id: objetId } = await params;

  // Récupérer l'objet avec ses secteurs
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
    include: {
      sectors: {
        orderBy: { createdAt: "asc" },
      },
      organization: true,
    },
  });

  if (!objet) {
    redirect("/dashboard");
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== objet.organizationId
  ) {
    redirect("/dashboard");
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: session.id,
      organizationId: objet.organizationId,
      role: "admin",
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft size={20} />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Modifier : {objet.nom}
          </h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <CardTitle className="text-lg mb-4">
                Informations générales
              </CardTitle>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Nom</Label>
                  <EditableField
                    initialValue={objet.nom}
                    fieldName="nom"
                    label="Nom"
                    objectId={objetId}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Adresse
                  </Label>
                  <EditableField
                    initialValue={objet.adresse}
                    fieldName="adresse"
                    label="Adresse"
                    objectId={objetId}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">Pays</Label>
                  <EditableCountryField
                    initialValue={objet.pays}
                    objectId={objetId}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Activité
                  </Label>
                  <EditableField
                    initialValue={objet.secteur}
                    fieldName="secteur"
                    label="Activité"
                    objectId={objetId}
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Icône
                  </Label>
                  <EditableIconField
                    initialValue={objet.icon}
                    objectId={objetId}
                  />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-lg mb-4">Organisation</CardTitle>
              <p className="font-medium text-foreground">
                {objet.organization.name}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="border-t pt-4 mt-4">
              <DeleteObjectButton objetId={objetId} objetName={objet.nom} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Secteurs ({objet.sectors.length})</CardTitle>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="flex items-center gap-2 text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium transition"
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {objet.sectors.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg border">
              <p className="text-muted-foreground mb-4">
                Aucun secteur n&apos;a été créé pour cet objet.
              </p>
              <Link
                href={`/dashboard/objet/${objetId}/secteur/new`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
              >
                <Plus size={16} />
                <span>Ajouter un secteur</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
