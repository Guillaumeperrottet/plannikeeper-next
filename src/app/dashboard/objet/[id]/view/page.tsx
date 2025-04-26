// src/app/dashboard/objet/[id]/view/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SectorViewer from "@/app/dashboard/objet/[id]/view/sector-viewer";

export default async function ObjetViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Assurez-vous que params.id est disponible avant de l'utiliser
  const objetId = params.id;

  // Récupérer l'objet avec ses secteurs
  const objet = await prisma.objet.findUnique({
    where: { id: objetId },
    include: {
      sectors: {
        orderBy: { name: "asc" },
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

  return (
    <div className="h-screen flex flex-col">
      {/* Content */}
      {objet.sectors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center p-6">
            <h2 className="text-xl font-medium text-foreground mb-2">
              Aucun secteur trouvé
            </h2>
            <p className="text-muted-foreground mb-4">
              Ajoutez des secteurs à cet objet pour les visualiser ici.
            </p>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Ajouter un secteur
            </Link>
          </div>
        </div>
      ) : (
        <SectorViewer
          sectors={objet.sectors.map((sector) => ({
            ...sector,
            image: sector.image || "", // Convert null to empty string
          }))}
          objetId={objetId}
        />
      )}
    </div>
  );
}
