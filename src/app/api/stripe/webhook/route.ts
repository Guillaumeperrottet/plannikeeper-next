import { NextRequest, NextResponse } from "next/server";
import { stripe, mapStripeStatusToInternal } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

// Désactiver l'analyse du corps pour les webhooks Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerData = await headers();
  const sig = headerData.get("stripe-signature");

  if (!sig) {
    return new NextResponse("No signature", { status: 400 });
  }

  try {
    // Vérifier la signature du webhook
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    // Gérer différents événements Stripe
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      // Ajouter d'autres gestionnaires d'événements selon vos besoins
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse(
      `Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 400 }
    );
  }
}

// Gestionnaires d'événements

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Récupérer les métadonnées
  const metadata = session.metadata;
  if (
    !metadata ||
    typeof metadata.organizationId !== "string" ||
    typeof metadata.planId !== "string"
  ) {
    console.error("Missing organizationId or planId in session metadata");
    return;
  }
  const { organizationId, planId } = metadata;

  // Mise à jour de la base de données
  await prisma.subscription.upsert({
    where: { organizationId },
    update: {
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer && "id" in session.customer
            ? session.customer.id
            : null,
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId,
      planId,
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer && "id" in session.customer
            ? session.customer.id
            : null,
      status: "ACTIVE", // Statut initial
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours par défaut, sera mis à jour
      cancelAtPeriodEnd: false,
    },
  });
}

import type Stripe from "stripe";

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Récupérer les métadonnées et l'organisation associée
  const { organizationId, planId } = subscription.metadata as {
    organizationId?: string;
    planId?: string;
  };

  if (!organizationId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  // Mettre à jour l'abonnement dans la base de données
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: mapStripeStatusToInternal(subscription.status),
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(
        (subscription as unknown as { current_period_start: number })
          .current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        (subscription as unknown as { current_period_end: number })
          .current_period_end * 1000
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // Mettre à jour le plan si spécifié
      ...(planId && { planId }),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Récupérer les métadonnées
  const { organizationId } = subscription.metadata;

  if (!organizationId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  // Mettre à jour l'abonnement dans la base de données
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: true,
    },
  });

  // Optionnel : Rétrograder au plan gratuit après expiration
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      // Récupérez l'ID du plan gratuit
      planId: await getFreePlanId(),
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Récupérer l'abonnement
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string })
    .subscription;
  if (!subscriptionId || typeof subscriptionId !== "string") {
    console.error("No subscription ID found in invoice");
    return;
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Récupérer les métadonnées
  const { organizationId } = subscription.metadata;

  if (!organizationId) {
    console.error("No organizationId in subscription metadata");
    return;
  }

  // Mettre à jour le statut de l'abonnement
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: "PAST_DUE",
    },
  });
}

// Fonction utilitaire pour obtenir l'ID du plan gratuit
async function getFreePlanId(): Promise<string> {
  const freePlan = await prisma.plan.findUnique({
    where: { name: "FREE" },
    select: { id: true },
  });

  if (!freePlan) {
    throw new Error("Free plan not found");
  }

  return freePlan.id;
}
