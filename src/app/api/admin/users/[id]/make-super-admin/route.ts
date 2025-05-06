// src/app/api/admin/users/[id]/make-super-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import fs from "fs";
import path from "path";

type RouteParams = {
  params: { id: string };
};

// Fonction pour mettre à jour la liste des super-admins
async function updateSuperAdminList(email: string): Promise<boolean> {
  try {
    // Chemin vers le fichier super-admin.ts
    const filePath = path.join(process.cwd(), "src", "lib", "super-admin.ts");

    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, "utf8");

    // Trouver la ligne contenant SUPER_ADMIN_EMAILS
    const regex = /const SUPER_ADMIN_EMAILS = \[([\s\S]*?)\];/;
    const match = content.match(regex);

    if (!match) {
      throw new Error(
        "La définition de SUPER_ADMIN_EMAILS n'a pas été trouvée"
      );
    }

    // Extraire la liste actuelle des emails
    const currentEmailsString = match[1];
    const currentEmails = currentEmailsString
      .split(",")
      .map((email) => email.trim().replace(/"/g, "").replace(/'/g, ""))
      .filter(Boolean);

    // Vérifier si l'email est déjà dans la liste
    if (currentEmails.includes(email)) {
      return false; // Pas de modification nécessaire
    }

    // Ajouter le nouvel email à la liste
    currentEmails.push(email);

    // Formater la nouvelle liste
    const newEmailsString = currentEmails
      .map((email) => `"${email}"`)
      .join(", ");

    // Mettre à jour le contenu du fichier
    const newContent = content.replace(
      regex,
      `const SUPER_ADMIN_EMAILS = [${newEmailsString}];`
    );

    // Écrire le nouveau contenu dans le fichier
    fs.writeFileSync(filePath, newContent, "utf8");

    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la liste des super-admins:",
      error
    );
    throw error;
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!currentUser || !(await superAdminGuard(currentUser.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (!targetUser.email) {
      return NextResponse.json(
        { error: "L'utilisateur n'a pas d'email valide" },
        { status: 400 }
      );
    }

    // Tenter d'ajouter l'email à la liste des super-admins
    try {
      const updated = await updateSuperAdminList(targetUser.email);

      if (!updated) {
        return NextResponse.json({
          success: false,
          message: "Cet utilisateur est déjà super-administrateur",
        });
      }

      return NextResponse.json({
        success: true,
        message: `${targetUser.name || targetUser.email} est maintenant super-administrateur`,
        user: targetUser,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la liste des super-admins:",
        error
      );

      // En environnement de production, cette approche ne fonctionnera pas car les fichiers sont en lecture seule
      // Dans ce cas, nous pourrions utiliser une table en base de données pour stocker les super-admins
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({
          success: false,
          message:
            "En production, veuillez mettre à jour manuellement la liste des super-admins dans le code source",
          user: targetUser,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la promotion en super-admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
