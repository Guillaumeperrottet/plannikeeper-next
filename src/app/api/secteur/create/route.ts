import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Créer un dossier pour les uploads si nécessaire
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const image = formData.get("image") as File;
    const objectId = formData.get("objectId") as string;

    if (!name || !image || !objectId) {
      return NextResponse.json(
        { error: "Données incomplètes" },
        { status: 400 }
      );
    }

    // Vérifier que l'objet existe et appartient à l'organisation de l'utilisateur
    const objet = await prisma.objet.findUnique({
      where: { id: objectId },
      include: { organization: true },
    });

    if (!objet) {
      return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur appartient à la même organisation que l'objet
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (
      !userWithOrg?.Organization ||
      userWithOrg.Organization.id !== objet.organizationId
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier cet objet" },
        { status: 403 }
      );
    }

    // Générer un nom de fichier unique avec UUID
    const fileExtension = image.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/${fileName}`;

    // Lire l'image et l'écrire dans le dossier public/uploads
    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(filePath, buffer);

    // Créer le secteur
    const sector = await prisma.sector.create({
      data: {
        name,
        image: publicPath,
        objectId: objectId,
      },
    });

    return NextResponse.json(sector);
  } catch (error) {
    console.error("Erreur lors de la création du secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du secteur" },
      { status: 500 }
    );
  }
}
