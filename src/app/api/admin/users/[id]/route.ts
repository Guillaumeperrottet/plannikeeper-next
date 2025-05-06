// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

type RouteParams = {
  params: { id: string };
};

// Récupérer un utilisateur spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Récupérer l'utilisateur avec ses informations associées
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Organization: true,
        OrganizationUser: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Mettre à jour un utilisateur
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const userId = params.id;
    const updateData = await request.json();

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Préparer les données à mettre à jour
    const userData = {
      name: updateData.name,
      email: updateData.email,
      emailVerified: updateData.emailVerified,
      image: updateData.image,
      // Attention à ne pas écraser les champs non fournis
      ...(updateData.organizationId && {
        organizationId: updateData.organizationId,
      }),
    };

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    // Si le rôle a été modifié et qu'il y a une organization
    if (updateData.role && updateData.organizationId) {
      // Vérifier si l'association OrganizationUser existe
      const orgUser = await prisma.organizationUser.findFirst({
        where: {
          userId,
          organizationId: updateData.organizationId,
        },
      });

      if (orgUser) {
        // Mettre à jour le rôle
        await prisma.organizationUser.update({
          where: { id: orgUser.id },
          data: { role: updateData.role },
        });
      } else {
        // Créer l'association
        await prisma.organizationUser.create({
          data: {
            userId,
            organizationId: updateData.organizationId,
            role: updateData.role,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Supprimer un utilisateur
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
