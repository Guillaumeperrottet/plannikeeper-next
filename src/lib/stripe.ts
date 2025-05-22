// src/lib/stripe.ts - Version production-ready
import Stripe from "stripe";

// Vérification robuste des variables d'environnement
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

// Logging pour debug (seulement en dev)
if (!isProduction) {
  console.log("🔧 Stripe Configuration:", {
    hasSecretKey: !!stripeSecretKey,
    keyPrefix: stripeSecretKey?.substring(0, 12) + "...",
    environment: isProduction ? "production" : "development",
    platform: isVercel ? "vercel" : "local",
  });
}

// Validation de la clé Stripe
if (!stripeSecretKey) {
  const errorMsg = `❌ STRIPE_SECRET_KEY manquante en ${isProduction ? "production" : "développement"}`;
  console.error(errorMsg);

  // En production, c'est critique
  if (isProduction) {
    throw new Error("STRIPE_SECRET_KEY est requise en production");
  }
  console.warn("⚠️ Fonctionnalités Stripe désactivées en développement");
}

// Initialisation Stripe conditionnelle
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-04-30.basil", // Version stable
      appInfo: {
        name: "PlanniKeeper",
        version: "1.0.0",
        url: isProduction ? "https://plannikeeper.ch" : "http://localhost:3000",
      },
      // Configuration spécifique à l'environnement
      typescript: true,
      timeout: isProduction ? 30000 : 10000, // 30s en prod, 10s en dev
    })
  : null;

// Configuration centralisée des plans avec IDs Stripe
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
    // IMPORTANT: Utilisez vos vrais IDs Stripe
    stripePriceId: isProduction
      ? "price_1RLldxBQLEouvGCfL3be36t8" // Votre ID LIVE
      : "price_test_personal", // ID TEST pour dev
    stripeProductId: isProduction
      ? "prod_SGIEtVCmOll3el" // Votre produit LIVE
      : "prod_test_personal", // Produit TEST pour dev
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
    stripePriceId: isProduction
      ? "price_1RLlfZBQLEouvGCfM7mFl469" // Votre ID LIVE
      : "price_test_professional", // ID TEST pour dev
    stripeProductId: isProduction
      ? "prod_SGIGQkZN7Seepi" // Votre produit LIVE
      : "prod_test_professional", // Produit TEST pour dev
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
    stripePriceId: null, // Pricing personnalisé
    stripeProductId: null,
  },
  // Plans administratifs (pas de Stripe)
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
    maxUsers: 1,
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

// Helpers utilitaires
export function getPlanDetails(planId: string) {
  return PLAN_DETAILS[planId as PlanId] || PLAN_DETAILS.FREE;
}

export function isValidPlanId(planId: string): planId is PlanId {
  return planId in PLAN_DETAILS;
}

export function isStripeAvailable(): boolean {
  return stripe !== null;
}

// Helper pour obtenir les plans payants avec Stripe
export function getPayablePlans() {
  return Object.values(PLAN_DETAILS).filter(
    (plan) => plan.stripePriceId && plan.price > 0
  );
}

// Validation de la configuration en production
if (isProduction && !stripeSecretKey) {
  console.error(
    "🚨 ERREUR CRITIQUE: STRIPE_SECRET_KEY manquante en production!"
  );
  console.error(
    "📝 Ajoutez la variable dans Vercel Dashboard > Settings > Environment Variables"
  );
}
