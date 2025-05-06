// src/app/pricing/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PricingPlans from "@/app/pricing/pricing-plans";

export default async function PricingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin?redirect=/pricing");
  }

  // Récupérer l'organisation de l'utilisateur
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    // L'utilisateur n'a pas d'organisation, rediriger vers la page de création
    redirect("/onboarding");
  }

  // Récupérer tous les plans disponibles
  const prismaPlans = await prisma.plan.findMany({
    orderBy: {
      price: "asc",
    },
  });

  // Convert Decimal to number for compatibility with the Plan interface
  const plans = prismaPlans.map((plan) => ({
    ...plan,
    price: typeof plan.price === "object" ? Number(plan.price) : plan.price,
    monthlyPrice:
      typeof plan.monthlyPrice === "object"
        ? Number(plan.monthlyPrice)
        : plan.monthlyPrice,
    yearlyPrice:
      typeof plan.yearlyPrice === "object"
        ? Number(plan.yearlyPrice)
        : plan.yearlyPrice,
  }));

  // Récupérer l'abonnement actuel
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: userWithOrg.Organization.id },
    include: { plan: true },
  });

  // Convert subscription plan Decimal to number if it exists
  const currentPlan = subscription?.plan
    ? {
        ...subscription.plan,
        price:
          typeof subscription.plan.price === "object"
            ? Number(subscription.plan.price)
            : subscription.plan.price,
        monthlyPrice:
          typeof subscription.plan.monthlyPrice === "object"
            ? Number(subscription.plan.monthlyPrice)
            : subscription.plan.monthlyPrice,
        yearlyPrice:
          typeof subscription.plan.yearlyPrice === "object"
            ? Number(subscription.plan.yearlyPrice)
            : subscription.plan.yearlyPrice,
      }
    : null;

  const organizationId = userWithOrg.Organization.id;
  const isAdmin = await prisma.organizationUser.findFirst({
    where: { userId: user.id, organizationId, role: "admin" },
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Choisissez votre plan
      </h1>

      <PricingPlans
        plans={plans}
        currentPlan={currentPlan}
        isAdmin={!!isAdmin}
        organizationId={organizationId}
      />
    </div>
  );
}
