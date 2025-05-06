// src/app/pricing/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import PricingPlans from "@/app/pricing/pricing-plans";

export default async function PricingPage() {
  // Récupérer l'utilisateur (mais ne pas rediriger s'il n'est pas connecté)
  const user = await getUser();
  let currentPlan = null;
  let organizationId = null;
  let isAdmin = false;

  // Récupérer tous les plans disponibles MAIS filtrer ceux qui sont réservés aux admins
  const prismaPlans = await prisma.plan.findMany({
    where: {
      name: {
        notIn: ["SUPER_ADMIN", "ILLIMITE"], // Exclure ces plans
      },
    },
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

  // Si l'utilisateur est connecté, récupérer son plan actuel et ses droits
  if (user) {
    // Récupérer l'organisation de l'utilisateur
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: { Organization: true },
    });

    if (userWithOrg?.Organization) {
      organizationId = userWithOrg.Organization.id;

      // Récupérer l'abonnement actuel
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId },
        include: { plan: true },
      });

      // Convert subscription plan Decimal to number if it exists
      if (subscription?.plan) {
        currentPlan = {
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
        };
      }

      // Vérifier si l'utilisateur est admin
      isAdmin = !!(await prisma.organizationUser.findFirst({
        where: { userId: user.id, organizationId, role: "admin" },
      }));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Choisissez votre plan
      </h1>

      <PricingPlans
        plans={plans}
        currentPlan={currentPlan}
        isAdmin={isAdmin}
        organizationId={organizationId || ""}
      />
    </div>
  );
}
