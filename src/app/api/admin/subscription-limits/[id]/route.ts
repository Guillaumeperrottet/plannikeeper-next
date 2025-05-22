import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import { updateCustomLimits } from "@/lib/subscription-limits";

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
    const { customLimits, planChange } = await request.json();

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Si on change de plan (pas juste les limites)
    if (planChange && planChange.newPlanName) {
      const newPlan = await prisma.plan.findUnique({
        where: { name: planChange.newPlanName },
      });

      if (!newPlan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
      }

      // Mettre à jour l'abonnement
      if (organization.subscription) {
        await prisma.subscription.update({
          where: { id: organization.subscription.id },
          data: {
            planId: newPlan.id,
            status: planChange.status || "ACTIVE",
          },
        });
      } else {
        // Créer un nouvel abonnement
        await prisma.subscription.create({
          data: {
            organizationId: orgId,
            planId: newPlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Si on modifie les limites personnalisées
    if (customLimits) {
      await updateCustomLimits(orgId, customLimits);
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

// src/app/api/admin/subscription-limits/[id]/quick-adjust/route.ts - Version améliorée
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: orgId } = await params;
    const { type, adjustment, setValue } = await request.json();

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les limites personnalisées
    const customLimits: Record<string, number | null> = {};

    if (setValue !== undefined) {
      // Définir une valeur absolue
      customLimits[`max${type.charAt(0).toUpperCase() + type.slice(1)}`] =
        setValue;
    } else if (adjustment !== undefined) {
      // Ajuster la valeur actuelle
      const currentLimit = organization.subscription?.plan
        ? organization.subscription.plan[
            `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof organization.subscription.plan
          ]
        : 1;

      const newValue = Math.max(
        0,
        ((currentLimit as number) || 1) + adjustment
      );
      customLimits[`max${type.charAt(0).toUpperCase() + type.slice(1)}`] =
        newValue;
    }

    // Appliquer les changements
    await updateCustomLimits(orgId, customLimits);

    return NextResponse.json({
      success: true,
      message:
        setValue !== undefined
          ? `Limite ${type} définie à ${setValue}`
          : `Limite ${type} ajustée de ${adjustment}`,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajustement rapide:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
