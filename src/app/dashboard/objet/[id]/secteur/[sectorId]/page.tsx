import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import SectorCanvas from "@/app/dashboard/objet/[id]/secteur/[sectorId]/SectorCanvas";

export default async function SectorViewPage({
  params,
}: {
  params: { id: string; sectorId: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer le secteur à afficher
  const sector = await prisma.sector.findUnique({
    where: { id: params.sectorId },
    include: {
      object: true,
      articles: true,
    },
  });

  if (!sector) {
    redirect(`/dashboard/objet/${params.id}`);
  }

  // Vérifier que l'utilisateur a accès à cet objet (même organisation)
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  // Vérifier si l'utilisateur a accès à cet objet spécifiquement
  const objectAccess = await prisma.objectAccess.findFirst({
    where: {
      userId: session.id,
      objectId: params.id,
    },
  });

  // Si pas d'accès spécifique, vérifier le rôle dans l'organisation
  const canEdit =
    objectAccess?.accessLevel === "admin" ||
    objectAccess?.accessLevel === "write" ||
    (await prisma.organizationUser.findFirst({
      where: {
        userId: session.id,
        organizationId: sector.object.organizationId,
        role: "admin",
      },
    }));

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/objet/${params.id}`}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">
            {sector.object.nom} - {sector.name}
          </h1>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/objet/${params.id}/secteur/${params.sectorId}/article/new`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Plus size={18} />
            <span>Nouvel article</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 relative overflow-hidden">
        <SectorCanvas
          sectorId={params.sectorId}
          articles={sector.articles}
          sectorImage={sector.image || "/placeholder-sector.jpg"}
          canEdit={!!canEdit}
          objectId={params.id}
        />
      </div>
    </div>
  );
}
