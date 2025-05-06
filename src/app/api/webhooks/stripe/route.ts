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
      // Checkout
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

      // Charges
      case "charge.refunded": {
        // Vous pourriez vouloir enregistrer cette information ou envoyer une notification
        console.log(`Remboursement traité: ${event.data.object.id}`);
        break;
      }

      case "charge.dispute.created": {
        // Un litige a été créé, vous pourriez vouloir notifier un administrateur
        console.log(`Litige créé: ${event.data.object.id}`);
        break;
      }

      // Customer
      case "customer.created": {
        // Un nouveau client a été créé
        console.log(`Client créé: ${event.data.object.id}`);
        break;
      }

      case "customer.deleted": {
        // Un client a été supprimé
        console.log(`Client supprimé: ${event.data.object.id}`);
        break;
      }

      case "customer.updated": {
        // Un client a été mis à jour
        console.log(`Client mis à jour: ${event.data.object.id}`);
        break;
      }

      case "customer.subscription.created": {
        const stripeSubscription = event.data.object as StripeSubscription;
        const customer = stripeSubscription.customer as string;

        // Récupérer l'abonnement dans votre base de données via le customerId
        const existingSubscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customer },
        });

        if (existingSubscription) {
          // Mettre à jour l'abonnement avec le nouvel ID d'abonnement Stripe
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              stripeSubscriptionId: stripeSubscription.id,
              status:
                stripeSubscription.status.toUpperCase() as SubscriptionStatus,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            },
          });
          console.log(`Abonnement créé pour: ${customer}`);
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

      // Invoice
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

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoice;

        if (invoice.subscription) {
          // Récupérer l'abonnement
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription },
            include: { organization: true },
          });

          if (subscription) {
            // Mettre à jour le statut en "PAST_DUE"
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: "PAST_DUE" },
            });

            // TODO: Envoyer une notification à l'utilisateur
            console.log(
              `Échec de paiement pour l'abonnement: ${subscription.id}`
            );
          }
        }
        break;
      }

      case "invoice.upcoming": {
        // Stripe vous avertit qu'une facture va être créée prochainement
        // Vous pourriez envoyer une notification à l'utilisateur
        console.log(`Facture à venir: ${event.data.object.id}`);
        break;
      }

      // Payment Method
      case "payment_method.updated": {
        // Une méthode de paiement a été mise à jour
        console.log(`Méthode de paiement mise à jour: ${event.data.object.id}`);
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
