// src/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/task/new/page.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import TaskForm from "../../task-form";

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ id: string; sectorId: string; articleId: string }>;
}) {
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  const { id: objetId, sectorId, articleId } = await params;

  // Vérifier que l'article existe et que l'utilisateur a accès
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: { include: { object: true } },
    },
  });

  if (!article) {
    redirect(`/dashboard/objet/${objetId}/view`);
  }

  // Vérifier que l'utilisateur appartient à la même organisation
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
    name: ou.user.name ?? "",
    email: ou.user.email ?? "",
  }));

  return (
    <div className="flex-1 overflow-auto p-6">
      <TaskForm
        task={undefined}
        users={users}
        articleId={articleId}
        onSave={async (taskData) => {
          "use server";
          // Cette fonction sera appelée côté serveur pour créer la tâche
          // Rediriger vers la liste des tâches après création
        }}
        onCancel={() => {
          // Cette fonction redirigera vers la liste des tâches
        }}
      />
    </div>
  );
}
