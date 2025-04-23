// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const {
    name,
    description,
    status,
    taskType,
    color,
    realizationDate,
    assignedToId,
    recurring,
    period,
    endDate,
    articleId,
  } = await req.json();

  // Vérifier que le nom de la tâche est présent
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  // Vérifier que l'article existe et que l'utilisateur a le droit d'y accéder
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      sector: {
        include: { object: true },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cet article" },
      { status: 403 }
    );
  }

  // Créer la tâche
  const task = await prisma.task.create({
    data: {
      name,
      description,
      status,
      taskType,
      color,
      realizationDate: realizationDate ? new Date(realizationDate) : null,
      assignedToId: assignedToId || null,
      recurring,
      period,
      endDate: endDate ? new Date(endDate) : null,
      articleId,
    },
  });

  return NextResponse.json(task);
}
