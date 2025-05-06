import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les données de la demande
    const { priceId, planId } = await req.json();

    if (!priceId || !planId) {
      return NextResponse.json(
        { error: "Price ID and Plan ID are required" },
        { status: 400 }
      );
    }

    // Récupérer l'organisation de l'utilisateur
    const orgUser = await prisma.organizationUser.findFirst({
      where: {
        userId: user.id,
        role: "admin", // Seuls les administrateurs peuvent souscrire à un abonnement
      },
      include: { organization: true },
    });

    if (!orgUser) {
      return NextResponse.json(
        { error: "You must be an admin to subscribe" },
        { status: 403 }
      );
    }

    const organizationId = orgUser.organization.id;

    // Vérifier si un abonnement existe déjà
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      // Rediriger vers le portail de gestion d'abonnement
      return NextResponse.json({
        url: `/api/stripe/billing-portal?returnUrl=${encodeURIComponent(req.headers.get("referer") || "/dashboard")}`,
      });
    }

    // Obtenir ou créer un client Stripe
    const stripeCustomerId = await getOrCreateStripeCustomer(
      organizationId,
      user.email || "unknown@email.com",
      orgUser.organization.name || "Organization"
    );

    // Créer une session de paiement Stripe
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/dashboard/billing/cancel`;

    const checkoutUrl = await createCheckoutSession(
      organizationId,
      stripeCustomerId,
      priceId,
      planId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
