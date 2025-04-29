// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";

// Typage mis à jour : params est une Promise qui résout { id: string }
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: taskId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier que la tâche existe et que l'utilisateur a accès
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
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Vérifier organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== task.article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
        { status: 403 }
      );
    }

    // Récupérer tous les documents de la tâche
    const documents = await prisma.document.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Récupération de l'ID depuis la promesse
  const { id: taskId } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Vérifier que la tâche existe et que l'utilisateur a accès
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
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Vérifier organisation
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== task.article.sector.object.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour accéder à cette tâche" },
        { status: 403 }
      );
    }

    // Traitement du formulaire
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier le type et la taille du fichier
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Type de fichier non pris en charge. Veuillez télécharger un PDF ou une image.",
        },
        { status: 400 }
      );
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // Créer et écrire le fichier
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const { v4: uuidv4 } = await import("uuid");

    const uploadDir = path.join(process.cwd(), "public/documents");
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    const publicPath = `/documents/${uniqueFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Enregistrer en base de données
    const document = await prisma.document.create({
      data: {
        name: file.name,
        filePath: publicPath,
        fileSize: file.size,
        fileType: file.type,
        taskId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Erreur lors du téléchargement du document :", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du document" },
      { status: 500 }
    );
  }
}
