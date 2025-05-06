// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import { Prisma } from "@prisma/client";

// GET : récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
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

// PUT : mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const updateData = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userData: {
      name?: string;
      email?: string;
      image?: string | null;
      emailVerified?: boolean;
      // organizationId is intentionally omitted here
    } = {
      name: updateData.name,
      email: updateData.email,
      image: updateData.image,
    };

    // Handle emailVerified separately since it's a boolean in the schema
    if (updateData.emailVerified !== undefined) {
      userData.emailVerified = updateData.emailVerified !== null;
    }
    const updateArgs: Prisma.UserUpdateArgs = {
      where: { id: userId },
      data: userData,
    };

    if (typeof updateData.organizationId === "string") {
      updateArgs.data.Organization = {
        connect: { id: updateData.organizationId },
      };
    }

    const updatedUser = await prisma.user.update(updateArgs);

    if (updateData.role && updateData.organizationId) {
      const orgUser = await prisma.organizationUser.findFirst({
        where: { userId, organizationId: updateData.organizationId },
      });

      if (orgUser) {
        await prisma.organizationUser.update({
          where: { id: orgUser.id },
          data: { role: updateData.role },
        });
      } else {
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

// DELETE : supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

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
