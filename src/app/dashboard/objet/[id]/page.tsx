import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import SectorsList from "./SectorsList";

export default async function ObjetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer l'objet
  const objet = await prisma.objet.findUnique({
    where: { id: params.id },
    include: {
      sectors: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!objet) {
    redirect("/dashboard");
  }

  // Vérifier que l'utilisateur a accès à cet objet (même organisation)
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

  // Vérifier si l'utilisateur a des droits d'édition
  const objectAccess = await prisma.objectAccess.findFirst({
    where: {
      userId: session.id,
      objectId: params.id,
    },
  });

  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: session.id,
      organizationId: objet.organizationId,
      role: "admin",
    },
  });

  const canEdit =
    objectAccess?.accessLevel === "write" ||
    objectAccess?.accessLevel === "admin" ||
    isAdmin;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{objet.nom}</h1>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/objet/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Edit size={18} />
            <span>Modifier l&apos;objet</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Adresse</h2>
          <p>{objet.adresse}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Secteur d&apos;activité</h2>
          <p>{objet.secteur}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Nombre de secteurs</h2>
          <p>{objet.sectors.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <SectorsList
          sectors={objet.sectors}
          objectId={params.id}
          canEdit={!!canEdit}
        />
      </div>
    </div>
  );
}
