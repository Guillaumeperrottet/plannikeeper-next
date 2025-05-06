// src/lib/stripe.ts
import Stripe from "stripe";

// Initialiser le client Stripe avec la clé API secrète
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Utilisez la version API la plus récente
  appInfo: {
    name: "PlanniKeeper",
    version: "0.1.0",
  },
});

// Types d'abonnement mappés aux IDs de produit/prix Stripe
export interface StripePriceMap {
  FREE: {
    id: string;
    priceId: {
      monthly: string | null;
      yearly: string | null;
    };
  };
  PERSONAL: {
    id: string;
    priceId: {
      monthly: string;
      yearly: string;
    };
  };
  PROFESSIONAL: {
    id: string;
    priceId: {
      monthly: string;
      yearly: string;
    };
  };
  ENTERPRISE: {
    id: string;
    priceId: {
      monthly: string | null;
      yearly: string | null;
    };
  };
}

// À remplir avec vos IDs de produit et de prix Stripe réels
export const STRIPE_PRICES: StripePriceMap = {
  FREE: {
    id: "prod_free",
    priceId: {
      monthly: null, // Pas de prix pour le plan gratuit
      yearly: null,
    },
  },
  PERSONAL: {
    id: "prod_personal",
    priceId: {
      monthly: "price_personal_monthly",
      yearly: "price_personal_yearly",
    },
  },
  PROFESSIONAL: {
    id: "prod_professional",
    priceId: {
      monthly: "price_professional_monthly",
      yearly: "price_professional_yearly",
    },
  },
  ENTERPRISE: {
    id: "prod_enterprise",
    priceId: {
      monthly: null, // Généralement sur mesure
      yearly: null,
    },
  },
};

// Fonctions utilitaires pour les opérations Stripe

// Créer ou récupérer un client Stripe
export async function getOrCreateStripeCustomer(
  organizationId: string,
  email: string,
  name: string
): Promise<string> {
  // Vérifier si un client existe déjà
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { stripeCustomerId: true },
  });

  // Si le client existe, le retourner
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Sinon, créer un nouveau client
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
    },
  });

  return customer.id;
}

// Créer un portail de facturation (pour gérer l'abonnement)
export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session did not return a URL.");
  }
  if (!session.url) {
    throw new Error("Stripe Checkout session did not return a URL.");
  }
  return session.url;
}

// Créer une session de paiement Stripe Checkout
export async function createCheckoutSession(
  organizationId: string,
  stripeCustomerId: string,
  priceId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      organizationId,
      planId,
    },
    subscription_data: {
      metadata: {
        organizationId,
        planId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session did not return a URL.");
  }
  return session.url;
}

// Mapper le statut Stripe au format interne
export function mapStripeStatusToInternal(
  stripeStatus: Stripe.Subscription.Status
):
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING" {
  const statusMap: Record<
    Stripe.Subscription.Status,
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED"
    | "UNPAID"
    | "INCOMPLETE"
    | "INCOMPLETE_EXPIRED"
    | "TRIALING"
  > = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    trialing: "TRIALING",
    paused: "PAST_DUE", // Fallback pour le statut paused qui n'existe pas dans notre enum
  };

  return statusMap[stripeStatus] || "INCOMPLETE";
}

import { prisma } from "./prisma";
