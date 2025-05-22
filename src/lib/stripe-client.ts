// src/lib/stripe-client.ts - Version client (sans variables serveur)

// Configuration centralisée des plans (sans Stripe server)
export const PLAN_DETAILS = {
  FREE: {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir PlanniKeeper",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxObjects: 3,
    maxStorage: 500, // MB
    maxSectors: 10,
    maxArticles: 25,
    maxTasks: 50,
    features: [
      "1 utilisateur",
      "3 objets immobiliers",
      "500MB de stockage",
      "Support communauté",
    ],
    popular: false,
  },
  PERSONAL: {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
    price: 12,
    monthlyPrice: 12,
    yearlyPrice: 120,
    maxUsers: 1,
    maxObjects: 10,
    maxStorage: 2048, // 2GB
    maxSectors: 50,
    maxArticles: 200,
    maxTasks: 500,
    features: [
      "1 utilisateur",
      "10 objets immobiliers",
      "2GB de stockage",
      "Support email",
      "Toutes les fonctionnalités",
    ],
    popular: true,
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les professionnels indépendants",
    price: 35,
    monthlyPrice: 35,
    yearlyPrice: 350,
    maxUsers: 10,
    maxObjects: 50,
    maxStorage: 10240, // 10GB
    maxSectors: 200,
    maxArticles: 1000,
    maxTasks: 2500,
    features: [
      "Jusqu'à 10 utilisateurs",
      "50 objets immobiliers",
      "10GB de stockage",
      "Support prioritaire",
      "Gestion des accès",
    ],
    popular: false,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Entreprise",
    description: "Pour les équipes et entreprises",
    price: 85,
    monthlyPrice: 85,
    yearlyPrice: 850,
    maxUsers: null, // Illimité
    maxObjects: null, // Illimité
    maxStorage: 51200, // 50GB
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
    features: [
      "Utilisateurs illimités",
      "Objets illimités",
      "50GB de stockage",
      "Support téléphone + email",
      "Formation incluse",
    ],
    popular: false,
  },
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Administrateur",
    description: "Accès complet au système",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
    features: ["Accès administrateur complet"],
    popular: false,
  },
  ILLIMITE: {
    id: "ILLIMITE",
    name: "Accès Illimité",
    description: "Plan spécial sans restrictions",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: null,
    maxObjects: null,
    maxStorage: null,
    maxSectors: null,
    maxArticles: null,
    maxTasks: null,
    features: ["Toutes fonctionnalités", "Aucune limite"],
    popular: false,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Plan Personnalisé",
    description: "Limites ajustées manuellement",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1,
    maxObjects: 1,
    maxStorage: 1024,
    maxSectors: 10,
    maxArticles: 25,
    maxTasks: 50,
    features: ["Limites personnalisées"],
    popular: false,
    customPricing: true,
  },
} as const;

export type PlanId = keyof typeof PLAN_DETAILS;

// Helpers utilitaires
export function getPlanDetails(planId: string) {
  return PLAN_DETAILS[planId as PlanId] || PLAN_DETAILS.FREE;
}

export function isValidPlanId(planId: string): planId is PlanId {
  return planId in PLAN_DETAILS;
}

// Helper pour obtenir les plans payants
export function getPayablePlans() {
  return Object.values(PLAN_DETAILS).filter((plan) => plan.price > 0);
}
