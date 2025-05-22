// src/lib/subscription-limits.ts - Version corrigée
import { prisma } from "./prisma";
import { getPlanDetails } from "@/lib/stripe"; // Import partagé pour les configs

export type LimitType =
  | "users"
  | "objects"
  | "storage"
  | "sectors"
  | "articles"
  | "tasks";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  unlimited: boolean;
  percentage?: number;
  remaining?: number;
}

interface OrganizationLimits {
  users: LimitCheckResult;
  objects: LimitCheckResult;
  storage: LimitCheckResult;
  sectors: LimitCheckResult;
  articles: LimitCheckResult;
  tasks: LimitCheckResult;
  planName: string;
  planId: string;
  isActive: boolean;
}

/**
 * Vérifie toutes les limites d'une organisation
 */
export async function checkAllOrganizationLimits(
  organizationId: string
): Promise<OrganizationLimits> {
  const subscription = await getOrganizationSubscription(organizationId);
  const planDetails = getPlanDetails(subscription.planName);

  // Récupérer tous les compteurs actuels
  const [
    userCount,
    objectCount,
    storageUsage,
    sectorCount,
    articleCount,
    taskCount,
  ] = await Promise.all([
    getCurrentCount(organizationId, "users"),
    getCurrentCount(organizationId, "objects"),
    getCurrentStorageUsage(organizationId),
    getCurrentCount(organizationId, "sectors"),
    getCurrentCount(organizationId, "articles"),
    getCurrentCount(organizationId, "tasks"),
  ]);

  return {
    users: buildLimitResult(userCount, planDetails.maxUsers),
    objects: buildLimitResult(objectCount, planDetails.maxObjects),
    storage: buildLimitResult(
      storageUsage,
      planDetails.maxStorage ? planDetails.maxStorage * 1024 * 1024 : null
    ),
    sectors: buildLimitResult(sectorCount, planDetails.maxSectors),
    articles: buildLimitResult(articleCount, planDetails.maxArticles),
    tasks: buildLimitResult(taskCount, planDetails.maxTasks),
    planName: subscription.planName,
    planId: subscription.planId,
    isActive: subscription.isActive,
  };
}

/**
 * Vérifie une limite spécifique
 */
export async function checkOrganizationLimits(
  organizationId: string,
  checkType: LimitType
): Promise<LimitCheckResult> {
  const subscription = await getOrganizationSubscription(organizationId);
  const planDetails = getPlanDetails(subscription.planName);

  const current = await getCurrentCount(organizationId, checkType);
  let limit: number | null = null;

  switch (checkType) {
    case "users":
      limit = planDetails.maxUsers;
      break;
    case "objects":
      limit = planDetails.maxObjects;
      break;
    case "storage":
      // Convertir MB en bytes pour la comparaison
      limit = planDetails.maxStorage
        ? planDetails.maxStorage * 1024 * 1024
        : null;
      break;
    case "sectors":
      limit = planDetails.maxSectors;
      break;
    case "articles":
      limit = planDetails.maxArticles;
      break;
    case "tasks":
      limit = planDetails.maxTasks;
      break;
  }

  return buildLimitResult(current, limit);
}

/**
 * Construit le résultat de vérification de limite
 */
function buildLimitResult(
  current: number,
  limit: number | null
): LimitCheckResult {
  if (limit === null) {
    return {
      allowed: true,
      current,
      limit: null,
      unlimited: true,
    };
  }

  const percentage = Math.round((current / limit) * 100);
  const remaining = Math.max(0, limit - current);

  return {
    allowed: current < limit,
    current,
    limit,
    unlimited: false,
    percentage,
    remaining,
  };
}

/**
 * Récupère l'abonnement d'une organisation avec fallback
 */
async function getOrganizationSubscription(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  // Si pas d'abonnement ou abonnement inactif, utiliser le plan gratuit
  if (!subscription || !isSubscriptionActive(subscription)) {
    return {
      planName: "FREE",
      planId: "FREE",
      isActive: false,
    };
  }

  return {
    planName: subscription.plan.name,
    planId: subscription.plan.id,
    isActive: true,
  };
}

/**
 * Vérifie si un abonnement est actif
 */
function isSubscriptionActive(subscription: { status: string }): boolean {
  return ["ACTIVE", "TRIALING"].includes(subscription.status);
}

/**
 * Récupère le nombre actuel pour un type de limite
 */
async function getCurrentCount(
  organizationId: string,
  limitType: LimitType
): Promise<number> {
  switch (limitType) {
    case "users":
      return await prisma.organizationUser.count({
        where: { organizationId },
      });

    case "objects":
      return await prisma.objet.count({
        where: { organizationId },
      });

    case "sectors":
      return await prisma.sector.count({
        where: { object: { organizationId } },
      });

    case "articles":
      return await prisma.article.count({
        where: { sector: { object: { organizationId } } },
      });

    case "tasks":
      return await prisma.task.count({
        where: {
          article: { sector: { object: { organizationId } } },
          archived: false, // Ne compter que les tâches non archivées
        },
      });

    case "storage":
      return await getCurrentStorageUsage(organizationId);

    default:
      return 0;
  }
}

/**
 * Récupère l'usage actuel du stockage en bytes
 */
async function getCurrentStorageUsage(organizationId: string): Promise<number> {
  // Vérifier si on a un enregistrement de stockage récent
  const storageUsage = await prisma.storageUsage.findUnique({
    where: { organizationId },
  });

  if (storageUsage) {
    return Number(storageUsage.totalUsedBytes);
  }

  // Sinon, calculer à la volée
  const documentsSize = await prisma.document.aggregate({
    where: {
      task: {
        article: {
          sector: {
            object: { organizationId },
          },
        },
      },
    },
    _sum: { fileSize: true },
  });

  return documentsSize._sum.fileSize || 0;
}

/**
 * Met à jour les limites personnalisées d'une organisation
 */
export async function updateCustomLimits(
  organizationId: string,
  customLimits: {
    maxUsers?: number | null;
    maxObjects?: number | null;
    maxStorage?: number | null;
    maxSectors?: number | null;
    maxArticles?: number | null;
    maxTasks?: number | null;
  }
): Promise<void> {
  // Vérifier si l'organisation a un abonnement
  let subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

  // Si pas d'abonnement, créer un plan personnalisé
  if (!subscription) {
    // Créer ou récupérer le plan CUSTOM
    let customPlan = await prisma.plan.findFirst({
      where: { name: "CUSTOM" },
    });

    if (!customPlan) {
      customPlan = await prisma.plan.create({
        data: {
          name: "CUSTOM",
          price: 0,
          monthlyPrice: 0,
          maxUsers: customLimits.maxUsers,
          maxObjects: customLimits.maxObjects,
          maxStorage: customLimits.maxStorage,
          hasCustomPricing: true,
          features: ["Limites personnalisées"],
        },
      });
    }

    // Créer l'abonnement
    subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planId: customPlan.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  // Mettre à jour le plan avec les nouvelles limites
  await prisma.plan.update({
    where: { id: subscription.planId },
    data: {
      maxUsers: customLimits.maxUsers,
      maxObjects: customLimits.maxObjects,
      maxStorage: customLimits.maxStorage,
      // Note: Vous devrez ajouter ces champs au modèle Plan
      // maxSectors: customLimits.maxSectors,
      // maxArticles: customLimits.maxArticles,
      // maxTasks: customLimits.maxTasks,
    },
  });
}

/**
 * Vérifie si une action peut être effectuée (avant création)
 */
export async function canPerformAction(
  organizationId: string,
  action: LimitType,
  additionalCount: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number | null;
}> {
  const limitCheck = await checkOrganizationLimits(organizationId, action);

  if (limitCheck.unlimited) {
    return {
      allowed: true,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  if (
    limitCheck.limit &&
    limitCheck.current + additionalCount > limitCheck.limit
  ) {
    return {
      allowed: false,
      reason: `Limite ${action} atteinte (${limitCheck.current}/${limitCheck.limit})`,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return {
    allowed: true,
    current: limitCheck.current,
    limit: limitCheck.limit,
  };
}
