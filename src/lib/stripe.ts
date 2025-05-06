// src/lib/stripe.ts
import Stripe from "stripe";

// Initialiser le client Stripe avec la clé API secrète
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Prix des plans (en centimes, car Stripe utilise la plus petite unité monétaire)
export const PLAN_PRICES = {
  FREE: 0,
  PERSONAL: 900, // 9€
  PROFESSIONAL: 2900, // 29€
  ENTERPRISE: null, // Sur mesure
};

// Détails des plans
export const PLAN_DETAILS = {
  FREE: {
    name: "Gratuit",
    description: "Pour particuliers et petits projets",
    features: ["1 utilisateur", "1 objet", "Fonctionnalités basiques"],
    maxUsers: 1,
    maxObjects: 1,
  },
  PERSONAL: {
    name: "Particulier",
    description: "Pour la gestion personnelle",
    features: ["1 utilisateur", "5 objets", "Toutes les fonctionnalités"],
    maxUsers: 1,
    maxObjects: 5,
  },
  PROFESSIONAL: {
    name: "Indépendant",
    description: "Pour les professionnels indépendants",
    features: [
      "Jusqu'à 5 utilisateurs",
      "20 objets",
      "Toutes les fonctionnalités",
      "Support email",
    ],
    maxUsers: 5,
    maxObjects: 20,
  },
  ENTERPRISE: {
    name: "Entreprise",
    description: "Pour les équipes et les entreprises",
    features: [
      "Utilisateurs illimités",
      "Objets illimités",
      "Toutes les fonctionnalités",
      "Support dédié",
    ],
    maxUsers: null, // Illimité
    maxObjects: null, // Illimité
    customPricing: true,
  },
};
