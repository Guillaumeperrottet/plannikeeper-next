import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SubscriptionDashboard from "./subscription-dashboard";

export default async function SubscriptionPage() {
  const user = await getUser();

  if (!user) {
    redirect("/signin?redirect=/dashboard/subscription");
  }

  // Récupérer l'organisation de l'utilisateur
  const userWithOrg = await prisma.user.findUnique({
    where: { id: user.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    redirect("/onboarding");
  }

  const organizationId = userWithOrg.Organization.id;

  // Vérifier si l'utilisateur est admin de l'organisation
  const isAdmin = await prisma.organizationUser.findFirst({
    where: {
      userId: user.id,
      organizationId,
      role: "admin",
    },
  });

  // Récupérer l'abonnement et les plans disponibles (maintenant avec ENTERPRISE)
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  const formattedSubscription = subscription
    ? {
        ...subscription,
        plan: {
          ...subscription.plan,
          price:
            typeof subscription.plan.price === "object"
              ? Number(subscription.plan.price)
              : subscription.plan.price,
          monthlyPrice:
            typeof subscription.plan.monthlyPrice === "object"
              ? Number(subscription.plan.monthlyPrice)
              : subscription.plan.monthlyPrice,
          yearlyPrice: subscription.plan.yearlyPrice
            ? typeof subscription.plan.yearlyPrice === "object"
              ? Number(subscription.plan.yearlyPrice)
              : subscription.plan.yearlyPrice
            : null,
        },
      }
    : null;

  return (
    <SubscriptionDashboard
      subscription={formattedSubscription}
      isAdmin={!!isAdmin}
    />
  );
}
