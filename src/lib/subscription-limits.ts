// src/lib/subscription-limits.ts
import { prisma } from "./prisma";

export async function checkOrganizationLimits(
  organizationId: string,
  checkType: "users" | "objects"
): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
  unlimited: boolean;
}> {
  try {
    // Récupérer l'abonnement et le plan de l'organisation
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    // Si pas d'abonnement ou plan, considérer comme plan gratuit
    if (!subscription || !subscription.plan) {
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        throw new Error("Plan gratuit non trouvé");
      }

      const limit =
        checkType === "users" ? freePlan.maxUsers : freePlan.maxObjects;
      const current = await getCurrentCount(organizationId, checkType);

      return {
        allowed: current < (limit || 0),
        current,
        limit,
        unlimited: limit === null,
      };
    }

    // Vérifier si l'abonnement est actif
    const isActive =
      subscription.status === "ACTIVE" || subscription.status === "TRIALING";
    if (!isActive) {
      // Si inactif, utiliser les limites du plan gratuit
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      if (!freePlan) {
        throw new Error("Plan gratuit non trouvé");
      }

      const limit =
        checkType === "users" ? freePlan.maxUsers : freePlan.maxObjects;
      const current = await getCurrentCount(organizationId, checkType);

      return {
        allowed: current < (limit || 0),
        current,
        limit,
        unlimited: limit === null,
      };
    }

    // Récupérer la limite du plan actuel
    const limit =
      checkType === "users"
        ? subscription.plan.maxUsers
        : subscription.plan.maxObjects;

    // Récupérer le nombre actuel
    const current = await getCurrentCount(organizationId, checkType);

    // Si la limite est null, c'est illimité
    if (limit === null) {
      return {
        allowed: true,
        current,
        limit: null,
        unlimited: true,
      };
    }

    // Comparer le nombre actuel avec la limite
    return {
      allowed: current < limit,
      current,
      limit,
      unlimited: false,
    };
  } catch (error) {
    console.error(
      `Erreur lors de la vérification des limites (${checkType}):`,
      error
    );
    // En cas d'erreur, on autorise par défaut
    return {
      allowed: true,
      current: 0,
      limit: 1,
      unlimited: false,
    };
  }
}

async function getCurrentCount(
  organizationId: string,
  checkType: "users" | "objects"
): Promise<number> {
  if (checkType === "users") {
    // Compter les utilisateurs non-admin dans l'organisation
    const count = await prisma.organizationUser.count({
      where: {
        organizationId,
      },
    });
    return count;
  } else {
    // Compter les objets dans l'organisation
    const count = await prisma.objet.count({
      where: {
        organizationId,
      },
    });
    return count;
  }
}
