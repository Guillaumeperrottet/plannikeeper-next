import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getUsersWithObjectAccess } from "@/lib/object-access-utils";
import TasksPageClient from "./TasksPageClient";

export default async function ArticleDetailPage({
  params,
}: {
  // params is now a Promise resolving the dynamic route params
  params: Promise<{ id: string; sectorId: string; articleId: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  // await the params promise and destructure the values
  const { id: objetId, sectorId, articleId } = await params;

  // Récupérer l'article avec ses tâches et le secteur parent
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tasks: {
        where: {
          archived: false, // Filtrer les tâches archivées ici
        },
        include: {
          assignedTo: true,
          documents: true,
        },
        orderBy: { createdAt: "desc" },
      },
      sector: { include: { object: true } },
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

  // Récupérer les utilisateurs qui ont accès à cet objet spécifique
  const users = await getUsersWithObjectAccess(article.sector.object.id);

  return (
    <TasksPageClient
      initialTasks={article.tasks}
      users={users}
      articleId={article.id}
      articleTitle={article.title}
      articleDescription={article.description}
      objetId={objetId}
      sectorId={sectorId}
    />
  );
}
