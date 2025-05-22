// src/lib/stripe.ts - Version corrigée
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "STRIPE_SECRET_KEY is not defined. Stripe functionality will be limited."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
  appInfo: {
    name: "PlanniKeeper",
    version: "0.1.0",
  },
});

// Configuration centralisée des plans avec toutes les limites
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
    stripePriceId: null,
    stripeProductId: null,
  },
  PERSONAL: {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
    price: 12,
    monthlyPrice: 12,
    yearlyPrice: 120, // 2 mois offerts
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
    stripePriceId: process.env.STRIPE_PERSONAL_PRICE_ID,
    stripeProductId: process.env.STRIPE_PERSONAL_PRODUCT_ID,
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les professionnels indépendants",
    price: 35,
    monthlyPrice: 35,
    yearlyPrice: 350, // 2 mois offerts
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
      "Rapports avancés",
    ],
    popular: false,
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Entreprise",
    description: "Pour les équipes et entreprises",
    price: 85,
    monthlyPrice: 85,
    yearlyPrice: 850, // 2 mois offerts
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
      "API access",
      "Intégrations avancées",
    ],
    popular: false,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
  },
  // Plans spéciaux pour l'administration
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
    stripePriceId: null,
    stripeProductId: null,
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
    stripePriceId: null,
    stripeProductId: null,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Plan Personnalisé",
    description: "Limites ajustées manuellement",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxUsers: 1, // Valeurs par défaut, modifiables
    maxObjects: 1,
    maxStorage: 1024,
    maxSectors: 10,
    maxArticles: 25,
    maxTasks: 50,
    features: ["Limites personnalisées"],
    popular: false,
    stripePriceId: null,
    stripeProductId: null,
    customPricing: true,
  },
} as const;

export type PlanId = keyof typeof PLAN_DETAILS;

// Helper pour récupérer un plan par son ID
export function getPlanDetails(planId: string) {
  return PLAN_DETAILS[planId as PlanId] || PLAN_DETAILS.FREE;
}

// Helper pour vérifier si un plan est valide
export function isValidPlanId(planId: string): planId is PlanId {
  return planId in PLAN_DETAILS;
}
