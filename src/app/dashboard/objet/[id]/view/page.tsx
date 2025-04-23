import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
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
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              Aucun secteur trouvé
            </h2>
            <p className="text-gray-500 mb-4">
              Ajoutez des secteurs à cet objet pour les visualiser ici.
            </p>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
