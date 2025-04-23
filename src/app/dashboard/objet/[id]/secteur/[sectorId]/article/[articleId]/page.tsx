// src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TaskList from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task-list";
import TaskForm from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task-form";

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string; sectorId: string; articleId: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  const objetId = params.id;
  const sectorId = params.sectorId;
  const articleId = params.articleId;

  // Récupérer l'article avec ses tâches et le secteur parent
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tasks: {
        include: {
          assignedTo: true,
        },
        orderBy: { createdAt: "desc" },
      },
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    redirect(`/dashboard/objet/${objetId}/view`);
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== article.sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  // Récupérer tous les utilisateurs de l'organisation pour l'attribution des tâches
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: article.sector.object.organizationId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const users = orgUsers.map((ou) => ({
    id: ou.user.id,
    name: ou.user.name,
    email: ou.user.email,
  }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/objet/${objetId}/view`}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">{article.title}</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-gray-600">
            {article.description || "Aucune description"}
          </p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            Secteur: {article.sector.name} • Créé le:{" "}
            {new Date(article.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Tâches ({article.tasks.length})
          </h2>
        </div>

        <TaskForm articleId={article.id} users={users} />

        <div className="mt-6">
          <TaskList
            tasks={article.tasks}
            users={users}
            articleId={article.id}
          />
        </div>
      </div>
    </div>
  );
}
