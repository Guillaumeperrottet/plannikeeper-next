import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import DeleteArticleButton from "@/app/dashboard/objet/[id]/secteur/[sectorId]/article/[articleId]/DeleteArticleButton";

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string; sectorId: string; articleId: string };
}) {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer l'article
  const article = await prisma.article.findUnique({
    where: { id: params.articleId },
    include: {
      sector: {
        include: {
          object: true,
        },
      },
      tasks: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!article) {
    redirect(`/dashboard/objet/${params.id}/secteur/${params.sectorId}`);
  }

  // Vérifier que l'utilisateur a accès à cet objet
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
      organizationId: article.sector.object.organizationId,
      role: "admin",
    },
  });

  const canEdit =
    objectAccess?.accessLevel === "write" ||
    objectAccess?.accessLevel === "admin" ||
    isAdmin;

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
          <h1 className="text-2xl font-bold">Détail de l&apos;article</h1>
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/objet/${params.id}/secteur/${params.sectorId}/article/${params.articleId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Edit size={18} />
            <span>Modifier</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">{article.title}</h2>
            {article.description && (
              <p className="text-gray-700 whitespace-pre-line">
                {article.description}
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Tâches associées</h3>
            {article.tasks.length === 0 ? (
              <p className="text-gray-500">Aucune tâche pour cet article</p>
            ) : (
              <ul className="space-y-2">
                {article.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center p-2 border rounded"
                  >
                    <div
                      className={`w-4 h-4 rounded-full mr-3 ${
                        task.done ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium">{task.name}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/objet/${params.id}/secteur/${params.sectorId}/article/${params.articleId}/task/${task.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Voir
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {canEdit && (
              <div className="mt-4">
                <Link
                  href={`/dashboard/objet/${params.id}/secteur/${params.sectorId}/article/${params.articleId}/task/new`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <Plus size={16} />
                  <span>Ajouter une tâche</span>
                </Link>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Zone de danger
              </h3>
              <DeleteArticleButton
                articleId={params.articleId}
                articleTitle={article.title}
                objectId={params.id}
                sectorId={params.sectorId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
