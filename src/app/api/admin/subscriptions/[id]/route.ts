// src/app/api/admin/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

// GET : récupérer une organisation spécifique
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

    const { id: orgId } = await params;
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          include: { OrganizationUser: { select: { role: true } } },
        },
        Objet: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'organisation :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT : mettre à jour une organisation et son abonnement
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

    const { id: orgId } = await params;
    const updateData = await request.json();

    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: { name: updateData.name },
    });

    if (updateData.subscription) {
      const {
        planName,
        status = "ACTIVE",
        cancelAtPeriodEnd = false,
      } = updateData.subscription;
      const plan = await prisma.plan.findUnique({ where: { name: planName } });
      if (!plan) {
        return NextResponse.json(
          { error: "Plan non trouvé", organization: updatedOrg },
          { status: 400 }
        );
      }

      const existingSub = await prisma.subscription.findUnique({
        where: { organizationId: orgId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId: plan.id,
            status,
            cancelAtPeriodEnd,
          },
        });
      } else {
        const now = new Date();
        await prisma.subscription.create({
          data: {
            organizationId: orgId,
            planId: plan.id,
            status,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            ),
            cancelAtPeriodEnd,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Organisation mise à jour avec succès",
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'organisation :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE : supprimer une organisation et tout son périmètre
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

    const { id: orgId } = await params;
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.subscription.deleteMany({ where: { organizationId: orgId } }),
      prisma.organizationUser.deleteMany({ where: { organizationId: orgId } }),
      prisma.invitationCode.deleteMany({ where: { organizationId: orgId } }),
      prisma.organization.delete({ where: { id: orgId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Organisation supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'organisation :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
