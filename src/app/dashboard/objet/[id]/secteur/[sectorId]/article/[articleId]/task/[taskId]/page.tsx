import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { getUsersWithObjectAccess } from "@/lib/object-access-utils";
import TaskDetailPage from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task/[taskId]/task-detail-page";

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
    sectorId: string;
    articleId: string;
    taskId: string;
  }>;
  searchParams: Promise<{ readonly?: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  const { id: objetId, sectorId, articleId, taskId } = await params;
  const { readonly } = await searchParams;

  // Récupérer la tâche avec tous les détails nécessaires
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      article: {
        include: {
          sector: {
            include: { object: true },
          },
        },
      },
      assignedTo: true,
    },
  });

  if (!task) {
    // Rediriger avec un paramètre pour indiquer que la tâche a été supprimée
    redirect(
      `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}?taskDeleted=true`
    );
  }

  // Vérifier que l'utilisateur appartient à la même organisatio
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    redirect("/dashboard");
  }

  // Récupérer les utilisateurs qui ont accès à cet objet spécifique
  const users = await getUsersWithObjectAccess(task.article.sector.object.id);

  return (
    <TaskDetailPage
      task={task}
      users={users}
      objetId={objetId}
      sectorId={sectorId}
      articleId={articleId}
      readonly={readonly === "true"}
    />
  );
}
