import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: orgId } = await params;
    const { customLimits } = await request.json();

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Si aucun abonnement n'existe, créer un plan personnalisé
    if (!organization.subscription) {
      // Créer ou récupérer un plan personnalisé
      let customPlan = await prisma.plan.findFirst({
        where: { name: "CUSTOM" },
      });

      if (!customPlan) {
        customPlan = await prisma.plan.create({
          data: {
            name: "CUSTOM",
            price: 0,
            monthlyPrice: 0,
            maxUsers: customLimits.maxUsers,
            maxObjects: customLimits.maxObjects,
            hasCustomPricing: true,
            features: ["Limites personnalisées"],
          },
        });
      }

      // Créer l'abonnement avec le plan personnalisé
      await prisma.subscription.create({
        data: {
          organizationId: orgId,
          planId: customPlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        },
      });
    } else {
      // Mettre à jour le plan existant avec les nouvelles limites
      await prisma.plan.update({
        where: { id: organization.subscription.planId },
        data: {
          maxUsers: customLimits.maxUsers,
          maxObjects: customLimits.maxObjects,
          // Note: pour le stockage, vous pourriez vouloir ajouter un champ maxStorage au modèle Plan
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Limites mises à jour avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des limites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
