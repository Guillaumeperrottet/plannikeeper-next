import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Briefcase, Plus } from "lucide-react";
import Image from "next/image";
import DeleteObjectButton from "@/app/dashboard/objet/[id]/edit/delete-object-button";

export default async function ObjetEditPage({
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
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{objet.nom}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/objet/${objetId}/edit/update`}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit size={16} />
            <span>Modifier</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Informations générales
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="min-w-8 mt-0.5">
                  <MapPin size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-gray-600">{objet.adresse}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="min-w-8 mt-0.5">
                  <Briefcase size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Secteur principal</p>
                  <p className="text-gray-600">{objet.secteur}</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Organisation</h2>
            <p className="font-medium">{objet.organization.name}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="border-t pt-4 mt-4">
            <DeleteObjectButton objetId={objetId} objetName={objet.nom} />
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Secteurs ({objet.sectors.length})
          </h2>
          <Link
            href={`/dashboard/objet/${objetId}/secteur/new`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
            <span>Ajouter un secteur</span>
          </Link>
        </div>

        {objet.sectors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">
              Aucun secteur n&apos;a été créé pour cet objet.
            </p>
            <Link
              href={`/dashboard/objet/${objetId}/secteur/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Ajouter un secteur</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objet.sectors.map((sector) => (
              <Link
                key={sector.id}
                href={`/dashboard/objet/${objetId}/view`}
                className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="relative w-full h-40">
                  <Image
                    src={sector.image || "/placeholder-image.jpg"}
                    alt={sector.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{sector.name}</h3>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-500">
                      {new Date(sector.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-blue-600 text-sm font-medium">
                      Voir détails
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
