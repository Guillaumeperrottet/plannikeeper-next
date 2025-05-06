// src/app/api/admin/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";
import { SubscriptionStatus } from "@prisma/client";

type RouteParams = {
  params: { id: string };
};

// Récupérer un abonnement spécifique
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

    const subscriptionId = params.id;

    // Récupérer l'abonnement avec ses informations détaillées
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: true,
        plan: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Mettre à jour un abonnement
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

    const subscriptionId = params.id;
    const updateData = await request.json();

    // Vérifier que l'abonnement existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    // Si un nouveau plan est spécifié, le récupérer
    let planId = existingSubscription.planId;

    if (updateData.plan && updateData.plan.name) {
      const newPlan = await prisma.plan.findUnique({
        where: { name: updateData.plan.name },
      });

      if (!newPlan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 400 });
      }

      planId = newPlan.id;
    }
    // Préparer les données à mettre à jour
    const subscriptionData: {
      status: SubscriptionStatus;
      planId: string;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd?: Date;
    } = {
      status:
        (updateData.status as SubscriptionStatus) ||
        existingSubscription.status,
      planId: planId,
      cancelAtPeriodEnd:
        updateData.cancelAtPeriodEnd !== undefined
          ? updateData.cancelAtPeriodEnd
          : existingSubscription.cancelAtPeriodEnd,
    };

    // Si une nouvelle date de fin de période est fournie
    if (updateData.currentPeriodEnd) {
      subscriptionData.currentPeriodEnd = new Date(updateData.currentPeriodEnd);
    }

    // Mettre à jour l'abonnement
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: subscriptionData,
      include: {
        plan: true,
        organization: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement mis à jour avec succès",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Supprimer un abonnement
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

    const subscriptionId = params.id;

    // Vérifier que l'abonnement existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: true,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'abonnement
    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    // Mettre à jour l'organisation avec un abonnement gratuit

    // Trouver le plan gratuit
    const freePlan = await prisma.plan.findUnique({
      where: { name: "FREE" },
    });

    if (!freePlan) {
      return NextResponse.json({
        success: true,
        message:
          "Abonnement supprimé, mais impossible de créer un plan gratuit car le plan FREE n'existe pas",
      });
    }
    // Créer un nouvel abonnement gratuit
    await prisma.subscription.create({
      data: {
        organizationId: existingSubscription.organizationId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      message: `Abonnement supprimé et remplacé par un plan gratuit pour ${existingSubscription.organization.name}`,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
