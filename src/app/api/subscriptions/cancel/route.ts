// src/app/api/subscriptions/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (!userWithOrg?.Organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est admin de l'organisation
    const isAdmin = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        organizationId: userWithOrg.Organization.id,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent annuler l'abonnement" },
        { status: 403 }
      );
    }

    // Récupérer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif trouvé" },
        { status: 404 }
      );
    }

    // Obtenir les détails de l'abonnement depuis Stripe
    const { cancelImmediately } = await req.json();

    if (cancelImmediately) {
      // Annulation immédiate de l'abonnement
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      // Annulation à la fin de la période (comportement par défaut)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Mettre à jour l'état dans la base de données
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: cancelImmediately ? false : true,
        status: cancelImmediately ? "CANCELED" : subscription.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: cancelImmediately
        ? "Abonnement annulé immédiatement"
        : "Abonnement programmé pour être annulé à la fin de la période en cours",
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'abonnement" },
      { status: 500 }
    );
  }
}
