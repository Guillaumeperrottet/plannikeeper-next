import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth-session";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  // Vérifier que l'utilisateur est connecté et est admin
  const currentUser = await getUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est admin
  const userWithRole = await prisma.organizationUser.findFirst({
    where: { userId: currentUser.id },
    select: { role: true, organizationId: true },
  });

  if (!userWithRole || userWithRole.role !== "admin") {
    return NextResponse.json({ error: "Accès restreint aux administrateurs" }, { status: 403 });
  }

  // Récupérer les données de la requête
  const { name, email, password } = await req.json();

  // Vérifier que l'email n'est pas déjà utilisé
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
  }

  // Générer un hash du mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Transaction pour créer l'utilisateur et ajouter à l'organisation
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          id: uuidv4(),
          name,
          email,
          emailVerified: false,
          organizationId: userWithRole.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 2. Créer le compte avec le mot de passe
      // Note: Pour better-auth, providerId doit être "email" et accountId doit contenir l'email
      await tx.account.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          providerId: "email",
          accountId: email,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 3. Associer l'utilisateur à l'organisation avec le rôle "member"
      await tx.organizationUser.create({
        data: {
          id: uuidv4(), // Assurez-vous d'avoir un ID unique
          userId: user.id,
          organizationId: userWithRole.organizationId,
          role: "member",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la création de l'utilisateur" }, { status: 500 });
  }
}
