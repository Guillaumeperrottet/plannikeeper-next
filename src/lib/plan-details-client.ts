// src/lib/plan-details-client.ts - Version client sécurisée
export const PLAN_DETAILS_CLIENT = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir PlanniKeeper",
    maxUsers: 1,
    maxObjects: 3,
    maxStorage: 500, // MB
    maxSectors: 10,
    maxArticles: 25,
    maxTasks: 50,
  },
  PERSONAL: {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
    maxUsers: 1,
    maxObjects: 10,
    maxStorage: 2048, // 2GB
    maxSectors: 50,
    maxArticles: 200,
    maxTasks: 500,
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les professionnels indépendants",
    maxUsers: 10,
    maxObjects: 50,
    maxStorage: 10240, // 10GB
    maxSectors: 200,
    maxArticles: 1000,
    maxTasks: 2500,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Entreprise",
    description: "Pour les équipes et entreprises",
    maxUsers: null, // Illimité
    maxObjects: null, // Illimité
    maxStorage: 51200, // 50GB
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
  },
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Administrateur",
    description: "Accès complet au système",
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
  },
  ILLIMITE: {
    id: "ILLIMITE",
    name: "Accès Illimité",
    description: "Plan spécial sans restrictions",
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Plan Personnalisé",
    description: "Limites ajustées manuellement",
    maxUsers: 1,
    maxObjects: 1,
    maxStorage: 1024,
    maxSectors: 10,
    maxArticles: 25,
    maxTasks: 50,
  },
} as const;

export type PlanIdClient = keyof typeof PLAN_DETAILS_CLIENT;

export function getPlanDetailsClient(planId: string) {
  return (
    PLAN_DETAILS_CLIENT[planId as PlanIdClient] || PLAN_DETAILS_CLIENT.FREE
  );
}
