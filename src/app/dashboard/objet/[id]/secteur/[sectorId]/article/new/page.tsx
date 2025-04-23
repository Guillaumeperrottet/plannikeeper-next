import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewArticleForm from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/new/NewArticleForm";

export default async function NewArticlePage({
  params,
  searchParams,
}: {
  params: { id: string; sectorId: string };
  searchParams?: { x?: string; y?: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer le secteur
  const sector = await prisma.sector.findUnique({
    where: { id: params.sectorId },
    include: { object: true },
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

  // Vérifier les droits d'édition
  const objectAccess = await prisma.objectAccess.findFirst({
    where: {
      userId: session.id,
      objectId: params.id,
    },
  });

  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: session.id,
      organizationId: sector.object.organizationId,
      role: "admin",
    },
  });

  if (
    !objectAccess?.accessLevel === "write" &&
    !objectAccess?.accessLevel === "admin" &&
    !isAdmin
  ) {
    redirect(`/dashboard/objet/${params.id}/secteur/${params.sectorId}`);
  }

  // Extraire les coordonnées initiales depuis les paramètres de recherche
  const initialX = searchParams?.x ? parseFloat(searchParams.x) : null;
  const initialY = searchParams?.y ? parseFloat(searchParams.y) : null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/objet/${params.id}/secteur/${params.sectorId}`}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Nouvel Article</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <NewArticleForm
          objectId={params.id}
          sectorId={params.sectorId}
          initialX={initialX}
          initialY={initialY}
        />
      </div>
    </div>
  );
}
