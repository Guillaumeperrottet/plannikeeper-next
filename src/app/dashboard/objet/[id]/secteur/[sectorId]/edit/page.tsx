// src/app/dashboard/objet/[id]/secteur/[sectorId]/edit/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import ArticleEditor from "./article-editor";

export default async function EditSectorPage({
  params,
}: {
  params: { id: string; sectorId: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  const objetId = params.id;
  const sectorId = params.sectorId;

  // Récupérer le secteur
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
    include: {
      object: true,
      articles: true,
    },
  });

  if (!sector) {
    redirect(`/dashboard/objet/${objetId}/edit`);
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
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

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/objet/${objetId}/edit`}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">
            Éditer le secteur: {sector.name}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ArticleEditor sectorId={sectorId} initialArticles={sector.articles}>
          {sector.image ? (
            <Image
              src={sector.image}
              alt={sector.name}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500">
              Aucune image disponible pour ce secteur
            </div>
          )}
        </ArticleEditor>
      </div>
    </div>
  );
}
