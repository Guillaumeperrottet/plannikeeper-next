// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// POST /api/tasks/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;

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

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
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

    // Vérifier le type de fichier
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

    // Vérifier la taille du fichier (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier est trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // Créer le dossier des documents s'il n'existe pas
    const uploadDir = path.join(process.cwd(), "public/documents");
    await mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    const publicPath = `/documents/${uniqueFileName}`;

    // Écrire le fichier
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Enregistrer le document dans la base de données
    const document = await prisma.document.create({
      data: {
        name: file.name,
        filePath: publicPath,
        fileSize: file.size,
        fileType: file.type,
        taskId: taskId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Erreur lors du téléchargement du document:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du document" },
      { status: 500 }
    );
  }
}

// GET /api/tasks/[id]/documents
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;

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

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
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
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;

  // Récupérer la tâche avec l'article associé
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
    return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
  }

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
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

  return NextResponse.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;
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
    executantComment,
  } = await req.json();

  // Vérifier que le nom de la tâche est présent
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Le nom de la tâche est requis" },
      { status: 400 }
    );
  }

  // Récupérer la tâche avec l'article associé
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

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Mettre à jour la tâche
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
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
      executantComment,
      // Si le statut est "completed", marquer comme terminée
      done: status === "completed",
    },
  });

  return NextResponse.json(updatedTask);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;
  const updateData = await req.json();

  // Récupérer la tâche avec l'article associé
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

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour modifier cette tâche" },
      { status: 403 }
    );
  }

  // Mettre à jour la tâche avec seulement les champs fournis
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const taskId = await params.id;

  // Récupérer la tâche avec l'article associé
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

  // Vérifier que l'utilisateur appartient à la même organisation que l'objet
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (
    !userWithOrg?.Organization ||
    userWithOrg.Organization.id !== task.article.sector.object.organizationId
  ) {
    return NextResponse.json(
      { error: "Vous n'avez pas les droits pour supprimer cette tâche" },
      { status: 403 }
    );
  }

  // Supprimer la tâche
  await prisma.task.delete({
    where: { id: taskId },
  });

  return NextResponse.json({ success: true });
}
