// src/app/components/landing/Pricing.tsx - Version mise à jour
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Check, Star, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { track } from "@vercel/analytics";

const plans = [
  {
    id: "FREE",
    name: "Gratuit",
    description: "Pour découvrir PlanniKeeper",
    price: 0,
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    color: "gray",
    features: [
      "1 utilisateur",
      "1 objet immobilier",
      "1 secteur",
      "10 articles maximum",
      "50 tâches maximum",
      "500MB de stockage",
      "Support communauté",
    ],
    limitations: ["Fonctionnalités de base", "Stockage limité"],
    ctaText: "Commencer gratuitement",
    highlight: "Idéal pour découvrir",
  },
  {
    id: "PERSONAL",
    name: "Particulier",
    description: "Pour la gestion personnelle",
    price: 12,
    monthlyPrice: 12,
    yearlyPrice: 120,
    popular: false,
    color: "blue",
    features: [
      "1 utilisateur",
      "1 objet immobilier",
      "3 secteurs",
      "200 articles maximum",
      "500 tâches maximum",
      "2GB de stockage",
      "Support email",
      "Toutes les fonctionnalités",
      "Notifications par email",
    ],
    ctaText: "Choisir Particulier",
    highlight: "Parfait pour les particuliers",
    badge: "Recommandé pour les propriétaires",
  },
  {
    id: "PROFESSIONAL",
    name: "Professionnel",
    description: "Pour les professionnels indépendants",
    price: 50,
    monthlyPrice: 50,
    yearlyPrice: 500,
    popular: true,
    color: "orange",
    features: [
      "Jusqu'à 5 utilisateurs",
      "3 objets immobiliers",
      "30 secteurs",
      "1000 articles maximum",
      "2500 tâches maximum",
      "10GB de stockage",
      "Support prioritaire",
      "Gestion des accès utilisateurs",
      "Notifications avancées",
      "Rapports détaillés",
      "Collaboration d'équipe",
    ],
    ctaText: "Choisir Professionnel",
    highlight: "Le plus populaire",
    badge: "Meilleur rapport qualité-prix",
  },
  {
    id: "ENTERPRISE",
    name: "Entreprise",
    description: "Pour les équipes et entreprises",
    price: 90,
    monthlyPrice: 90,
    yearlyPrice: 850,
    popular: false,
    color: "purple",
    features: [
      "Jusqu'à 10 utilisateurs",
      "5 objets immobiliers",
      "Secteurs illimités",
      "Articles illimités",
      "Tâches illimitées",
      "50GB de stockage",
      "Support téléphone + email",
      "Formation personnalisée",
      "API d'intégration",
      "Personnalisation avancée",
      "Sauvegarde automatique",
      "SLA garanti",
    ],
    ctaText: "Contacter les ventes",
    highlight: "Solution complète",
    badge: "Support premium inclus",
  },
];

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handlePlanClick = (planId: string, source: string) => {
    track("pricing_plan_clicked", {
      plan: planId,
      source: source,
      billing_cycle: billingCycle,
      timestamp: new Date().toISOString(),
    });
  };

  const getColorClasses = (color: string, isPopular: boolean = false) => {
    const colors = {
      gray: {
        gradient: "from-gray-500 to-gray-600",
        button: "bg-gray-600 hover:bg-gray-700",
        border: "border-gray-200 hover:border-gray-400",
        accent: "text-gray-600",
        bg: "bg-gray-50",
      },
      blue: {
        gradient: "from-blue-500 to-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
        border: "border-blue-200 hover:border-blue-400",
        accent: "text-blue-600",
        bg: "bg-blue-50",
      },
      orange: {
        gradient: "from-[#d9840d] to-[#e36002]",
        button: "bg-[#d9840d] hover:bg-[#c6780c]",
        border: isPopular
          ? "border-[#d9840d] ring-2 ring-[#d9840d]/20"
          : "border-[#ffedd5] hover:border-[#d9840d]",
        accent: "text-[#d9840d]",
        bg: "bg-[#fff7ed]",
      },
      purple: {
        gradient: "from-purple-500 to-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
        border: "border-purple-200 hover:border-purple-400",
        accent: "text-purple-600",
        bg: "bg-purple-50",
      },
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef] relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute -right-32 top-1/4 w-96 h-96 rounded-full bg-[#d9840d]/10 blur-3xl"></div>
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 rounded-full bg-[#e8ebe0]/40 blur-2xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* En-tête de section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#d9840d]/10 px-4 py-2 rounded-full mb-6 border border-[#d9840d]/20">
            <span className="text-[#d9840d] font-medium text-sm">
              Plans et tarifs
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
            Choisissez votre plan
          </h2>
          <p className="text-lg text-[#62605d] max-w-3xl mx-auto mb-8">
            Sélectionnez l&apos;offre qui correspond le mieux à vos besoins et
            commencez à optimiser la gestion de vos projets immobiliers dès
            aujourd&apos;hui.
          </p>

          {/* Toggle de facturation */}
          <div className="inline-flex items-center justify-center gap-4 bg-white p-2 rounded-xl border border-[#beac93]">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#d9840d] text-white shadow-sm"
                  : "text-[#62605d] hover:text-[#141313]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                billingCycle === "yearly"
                  ? "bg-[#d9840d] text-white shadow-sm"
                  : "text-[#62605d] hover:text-[#141313]"
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -15%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Grille des plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => {
            const colors = getColorClasses(plan.color, plan.popular);
            const price =
              billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const displayPrice = billingCycle === "yearly" ? price / 12 : price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`relative bg-white rounded-2xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl ${colors.border} ${
                  plan.popular ? "transform scale-105" : ""
                }`}
              >
                {/* Badge populaire */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#d9840d] to-[#e36002] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      <Sparkles className="w-4 h-4" />
                      {plan.highlight}
                    </div>
                  </div>
                )}

                {/* Badge recommandé */}
                {plan.badge && !plan.popular && (
                  <div className="absolute -top-3 left-4 right-4">
                    <div
                      className={`${colors.bg} ${colors.accent} text-center text-xs font-medium py-2 rounded-lg border ${colors.border}`}
                    >
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* En-tête du plan */}
                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}
                    >
                      {plan.id === "FREE" && (
                        <Star className="w-8 h-8 text-white" />
                      )}
                      {plan.id === "PERSONAL" && (
                        <Check className="w-8 h-8 text-white" />
                      )}
                      {plan.id === "PROFESSIONAL" && (
                        <Sparkles className="w-8 h-8 text-white" />
                      )}
                      {plan.id === "ENTERPRISE" && (
                        <Star className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <h3 className={`text-2xl font-bold ${colors.accent} mb-2`}>
                      {plan.name}
                    </h3>
                    <p className="text-[#62605d] text-sm">{plan.description}</p>
                  </div>

                  {/* Prix */}
                  <div className="text-center mb-8">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-bold text-[#141313]">
                        Gratuit
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-[#141313]">
                          {Math.round(displayPrice)}€
                        </span>
                        <span className="text-[#62605d] ml-1">/mois</span>
                        {billingCycle === "yearly" && (
                          <div className="text-sm text-[#16a34a] mt-1">
                            Facturé {plan.yearlyPrice}€/an
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fonctionnalités */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: featureIndex * 0.05,
                        }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center mt-0.5 flex-shrink-0`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[#62605d] text-sm leading-relaxed">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <Link
                      href={
                        plan.id === "ENTERPRISE"
                          ? "/contact?subject=Demande%20Plan%20Entreprise"
                          : `/signup?plan=${plan.id}`
                      }
                      onClick={() =>
                        handlePlanClick(plan.id, "pricing_section")
                      }
                    >
                      <Button
                        className={`w-full py-3 ${colors.button} text-white font-medium transition-all duration-200 hover:shadow-lg`}
                      >
                        {plan.ctaText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                    {plan.id !== "FREE" && (
                      <p className="text-xs text-[#62605d] text-center">
                        Essai gratuit de 7 jours
                      </p>
                    )}
                  </div>
                </div>

                {/* Accent en bas */}
                <div
                  className={`h-1 bg-gradient-to-r ${colors.gradient} rounded-b-2xl`}
                ></div>
              </motion.div>
            );
          })}
        </div>

        {/* Section supplémentaire */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-20 text-center"
        >
          <div className="bg-white/50 backdrop-blur-sm border border-[#beac93]/30 rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-[#141313] mb-2">
                  Besoin d&apos;un plan sur mesure ?
                </h3>
                <p className="text-[#62605d]">
                  Pour les besoins spécifiques ou les grandes équipes, nous
                  proposons des solutions personnalisées avec un support dédié.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="border-[#d9840d] text-[#d9840d] hover:bg-[#d9840d] hover:text-white"
                    onClick={() => handlePlanClick("CUSTOM", "pricing_section")}
                  >
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ rapide */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-[#d9840d]" />
            </div>
            <h4 className="font-semibold text-[#141313] mb-2">
              Changement de plan
            </h4>
            <p className="text-sm text-[#62605d]">
              Changez de plan à tout moment selon vos besoins. Mise à niveau ou
              rétrogradation instantanée.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-[#d9840d]" />
            </div>
            <h4 className="font-semibold text-[#141313] mb-2">
              Garantie 30 jours
            </h4>
            <p className="text-sm text-[#62605d]">
              Pas satisfait ? Nous vous remboursons intégralement sous 30 jours,
              sans question.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-[#d9840d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-[#d9840d]" />
            </div>
            <h4 className="font-semibold text-[#141313] mb-2">
              Support inclus
            </h4>
            <p className="text-sm text-[#62605d]">
              Notre équipe support est là pour vous accompagner dans votre
              utilisation de PlanniKeeper.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
