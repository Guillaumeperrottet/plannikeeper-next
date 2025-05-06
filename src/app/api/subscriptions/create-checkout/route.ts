// src/app/api/subscriptions/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe, PLAN_DETAILS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { planType } = await req.json();

    // Vérifiez que le plan est valide
    if (!planType || !Object.keys(PLAN_DETAILS).includes(planType)) {
      return NextResponse.json({ error: "Plan non valide" }, { status: 400 });
    }

    // Pour les plans sur mesure (ENTERPRISE), rediriger vers un formulaire de contact
    if (planType === "ENTERPRISE") {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/contact?plan=enterprise`,
      });
    }

    // Obtenez l'organisation de l'utilisateur
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

    // Vérifiez si l'organisation a déjà un abonnement
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId: userWithOrg.Organization.id },
      include: { plan: true },
    });

    // Pour le plan FREE, mettez simplement à jour la base de données
    if (planType === "FREE") {
      // Trouvez le plan gratuit
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        return NextResponse.json(
          { error: "Plan gratuit non trouvé" },
          { status: 404 }
        );
      }

      // Si un abonnement existe déjà, mettez-le à jour
      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: freePlan.id,
            status: "ACTIVE",
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            cancelAtPeriodEnd: false,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          },
        });
      } else {
        // Sinon, créez un nouvel abonnement
        await prisma.subscription.create({
          data: {
            organizationId: userWithOrg.Organization.id,
            planId: freePlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          },
        });
      }

      return NextResponse.json({
        success: true,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=activated`,
      });
    }

    // Pour les autres plans, créez une session de paiement Stripe
    const plan = await prisma.plan.findUnique({
      where: { name: planType },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    // Vérifiez si l'organisation a déjà un client Stripe
    let customerId = existingSubscription?.stripeCustomerId || null;

    // Si non, créez un nouveau client Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: userWithOrg.Organization.name,
        metadata: {
          organizationId: userWithOrg.Organization.id,
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Créez une session de paiement
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId!, // Assurez-vous que ce champ existe dans votre modèle Plan
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=canceled`,
      metadata: {
        organizationId: userWithOrg.Organization.id,
        planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}
