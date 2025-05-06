// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

// Types pour les objets Stripe
interface StripeCheckoutSession extends Stripe.Checkout.Session {
  metadata: {
    organizationId?: string;
    planType?: string;
  };
  customer: string;
  subscription: string;
  current_period_start: number;
  current_period_end: number;
}

interface StripeInvoice extends Stripe.Invoice {
  subscription: string;
  period_start: number;
  period_end: number;
}

interface StripeSubscription extends Stripe.Subscription {
  id: string;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
}

export async function POST(req: NextRequest) {
  try {
    // Obtenir le corps brut de la requête en tant que texte
    const body = await req.text();

    // Récupérer l'en-tête de signature Stripe
    const signature = req.headers.get("stripe-signature") as string;

    if (!signature) {
      console.error("Signature Stripe manquante");
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    // Vérifier la signature avec le corps brut
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    ) as Stripe.Event;

    console.log(`Événement Stripe reçu : ${event.type}`);

    // Traiter les différents types d'événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as StripeCheckoutSession;
        const { organizationId, planType } = session.metadata || {};

        if (!organizationId || !planType) {
          console.error("Métadonnées manquantes dans la session de paiement");
          break;
        }

        // Récupérer le plan correspondant
        const plan = await prisma.plan.findUnique({
          where: { name: planType as PlanType },
        });

        if (!plan) {
          console.error(`Plan non trouvé: ${planType}`);
          break;
        }

        // Mise à jour ou création de l'abonnement
        await prisma.subscription.upsert({
          where: { organizationId },
          update: {
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            status: "ACTIVE",
            currentPeriodStart: new Date(session.current_period_start * 1000),
            currentPeriodEnd: new Date(session.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
          create: {
            organizationId,
            planId: plan.id,
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            status: "ACTIVE",
            currentPeriodStart: new Date(session.current_period_start * 1000),
            currentPeriodEnd: new Date(session.current_period_end * 1000),
            cancelAtPeriodEnd: false,
          },
        });

        console.log(
          `Abonnement créé/mis à jour pour l'organisation: ${organizationId}, plan: ${planType}`
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as StripeInvoice;

        if (invoice.subscription) {
          // Récupérer l'abonnement
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription },
          });

          if (subscription) {
            // Mettez à jour les dates de période
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                currentPeriodStart: new Date(invoice.period_start * 1000),
                currentPeriodEnd: new Date(invoice.period_end * 1000),
                status: "ACTIVE",
              },
            });
            console.log(
              `Dates d'abonnement mises à jour pour: ${subscription.id}`
            );
          } else {
            console.warn(`Abonnement non trouvé pour: ${invoice.subscription}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as StripeSubscription;

        // Récupérer l'abonnement dans votre base de données
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubscription.id },
        });

        if (subscription) {
          // Mettez à jour l'état de l'abonnement
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status:
                stripeSubscription.status.toUpperCase() as SubscriptionStatus,
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
            },
          });
          console.log(`État d'abonnement mis à jour pour: ${subscription.id}`);
        } else {
          console.warn(`Abonnement non trouvé pour: ${stripeSubscription.id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as StripeSubscription;

        // Récupérer l'abonnement dans votre base de données
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubscription.id },
        });

        if (subscription) {
          // Trouvez le plan gratuit
          const freePlan = await prisma.plan.findUnique({
            where: { name: "FREE" },
          });

          if (freePlan) {
            // Revenez au plan gratuit
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                planId: freePlan.id,
                status: "CANCELED",
                cancelAtPeriodEnd: false,
              },
            });
            console.log(
              `Abonnement annulé et retour au plan gratuit pour: ${subscription.id}`
            );
          }
        } else {
          console.warn(`Abonnement non trouvé pour: ${stripeSubscription.id}`);
        }
        break;
      }

      default:
        console.log(`Événement Stripe non géré: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur du webhook Stripe:", error);
    return NextResponse.json(
      {
        error: `Erreur de webhook: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      },
      { status: 400 }
    );
  }
}
