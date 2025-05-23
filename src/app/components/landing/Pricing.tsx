import { useState } from "react";
import { motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { Button } from "@/app/components/ui/button";
import {
  Check,
  CheckCircle2,
  Sparkles,
  Users,
  Building2,
  Home,
  Mail,
} from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Fonction de tracking pour les interactions pricing
  const handlePricingInteraction = (
    action: string,
    planName?: string,
    additional?: Record<string, unknown>
  ) => {
    track("pricing_interaction", {
      action,
      plan: planName || "",
      billing_cycle: billingCycle,
      timestamp: new Date().toISOString(),
      ...additional,
    });
  };

  const handleBillingToggle = (cycle: string) => {
    setBillingCycle(cycle);
    handlePricingInteraction("billing_cycle_changed", undefined, {
      new_cycle: cycle,
    });
  };

  const handlePlanClick = (planName: string, isContact = false) => {
    if (isContact) {
      handlePricingInteraction("contact_enterprise_clicked", planName);
    } else {
      handlePricingInteraction("plan_selected", planName);
    }
  };

  const plans = [
    {
      name: "FREE",
      displayName: "Gratuit",
      icon: Home,
      price: { monthly: "0CHF", yearly: "0CHF" },
      description: "Pour découvrir PlanniKeeper",
      features: [
        "1 utilisateur",
        "3 objets immobiliers",
        "500MB de stockage",
        "Support communauté",
      ],
      limitations: ["Fonctionnalités limitées", "Pas de support prioritaire"],
      color: "from-gray-100 to-gray-200",
      textColor: "text-gray-800",
      borderColor: "border-gray-300",
      buttonColor: "bg-gray-600 hover:bg-gray-700 text-white",
      buttonVariant: "outline",
    },
    {
      name: "PERSONAL",
      displayName: "Privé",
      icon: Home,
      price: { monthly: "12CHF", yearly: "120CHF" },
      description: "Pour la gestion de bien personnels",
      features: [
        "1 utilisateur",
        "10 objets immobiliers",
        "2GB de stockage",
        "Support email",
        "Toutes les fonctionnalités",
      ],
      highlight: billingCycle === "yearly" ? "Économisez 24CHF par an" : null,
      color: "from-blue-50 to-blue-100",
      textColor: "text-blue-900",
      borderColor: "border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonVariant: "default",
    },
    {
      name: "PROFESSIONAL",
      displayName: "Indépendant",
      icon: Users,
      popular: true,
      price: { monthly: "35CHF", yearly: "350CHF" },
      description: "Pour les professionnels indépendants",
      features: [
        "Jusqu'à 10 utilisateurs",
        "50 objets immobiliers",
        "10GB de stockage",
        "Support prioritaire",
        "Gestion des accès",
      ],
      highlight: billingCycle === "yearly" ? "Économisez 70CHF par an" : null,
      color: "from-[#d9840d]/10 to-[#e36002]/10",
      textColor: "text-[#d9840d]",
      borderColor: "border-[#d9840d]",
      buttonColor: "bg-[#d9840d] hover:bg-[#c6780c] text-white",
      buttonVariant: "default",
    },
    {
      name: "ENTERPRISE",
      displayName: "Entreprise",
      icon: Building2,
      price: { monthly: "-", yearly: "-" },
      description: "Pour les équipes et entreprises",
      features: [
        "Utilisateurs illimités",
        "Objets illimités",
        "50GB et + de stockage",
        "Support téléphone + email",
        "Formation",
      ],
      highlight: billingCycle === "yearly" ? "Économisez 170€ par an" : null,
      color: "from-purple-50 to-purple-100",
      textColor: "text-purple-900",
      borderColor: "border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700 text-white",
      buttonVariant: "default",
      contactOnly: true,
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block bg-[#e8ebe0] px-4 py-1 rounded-full mb-4 border border-[#beac93]">
            <span className="text-[#62605d] font-medium text-sm">
              Tarifs transparents
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
            Choisissez l&apos;offre qui vous convient
          </h2>
          <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
            Des formules adaptées à tous les besoins, avec la possibilité
            d&apos;évoluer à mesure que votre activité se développe.
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                onClick={() => handleBillingToggle("monthly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-[#d9840d] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => handleBillingToggle("yearly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  billingCycle === "yearly"
                    ? "bg-white text-[#d9840d] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Annuel{" "}
                <Sparkles
                  size={12}
                  className={
                    billingCycle === "yearly"
                      ? "text-[#d9840d]"
                      : "text-gray-400"
                  }
                />
              </button>
            </div>
          </div>

          {billingCycle === "yearly" && (
            <p className="mt-3 text-sm text-[#d9840d]">
              Économisez jusqu&apos;à 16% avec nos formules annuelles
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`rounded-2xl overflow-hidden transition-all duration-300 relative cursor-pointer ${
                plan.popular
                  ? "border-2 border-[#d9840d] shadow-lg shadow-[#d9840d]/10"
                  : "border border-[#beac93]"
              }`}
              onClick={() => {
                handlePricingInteraction("plan_card_clicked", plan.name);
              }}
            >
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#d9840d] to-[#e36002]"></div>
              )}

              <div
                className={`p-6 md:p-8 bg-gradient-to-br ${plan.color} ${plan.textColor}`}
              >
                {plan.popular && (
                  <span className="absolute top-4 right-4 bg-[#d9840d] text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAIRE
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center ${plan.textColor}`}
                  >
                    <plan.icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold">{plan.displayName}</h3>
                </div>

                <p className="text-sm opacity-80 mb-6">{plan.description}</p>

                <div className="flex items-end mb-6">
                  <span className="text-3xl md:text-4xl font-bold">
                    {plan.price[billingCycle as keyof typeof plan.price]}
                  </span>
                  {plan.price[billingCycle as keyof typeof plan.price] !==
                    "Sur mesure" && (
                    <span className="text-lg ml-1 opacity-80">
                      {billingCycle === "monthly" ? "/mois" : "/an"}
                    </span>
                  )}
                </div>

                {plan.highlight && (
                  <div className="bg-white/30 rounded-lg p-2 mb-6 text-sm font-medium text-center">
                    {plan.highlight}
                  </div>
                )}

                {plan.contactOnly ? (
                  <Link
                    href="/contact?subject=Demande%20Plan%20Entreprise"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanClick(plan.name, true);
                    }}
                  >
                    <Button
                      className={`w-full py-6 font-bold rounded-xl ${plan.buttonColor} transition-all`}
                      variant={plan.buttonVariant as "default" | "outline"}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Nous contacter
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className={`w-full py-6 font-bold rounded-xl ${plan.buttonColor} transition-all`}
                    variant={plan.buttonVariant as "default" | "outline"}
                    asChild
                  >
                    <Link
                      href={`/signup?plan=${encodeURIComponent(plan.name)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanClick(plan.name);
                      }}
                    >
                      Commencer maintenant
                    </Link>
                  </Button>
                )}
              </div>

              <div className="p-6 md:p-8 bg-white border-t border-gray-100">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} className={plan.textColor} />
                  <span>Fonctionnalités incluses</span>
                </h4>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 ${plan.textColor} flex-shrink-0`}
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <>
                    <div className="border-t border-gray-100 my-4"></div>
                    <h4 className="text-sm text-gray-500 mb-3">
                      Limitations :
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-500 flex items-center gap-2"
                        >
                          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-full border border-blue-100">
            <Sparkles size={16} className="text-blue-500" />
            <p className="text-sm text-blue-700 font-medium">
              Vous avez besoin d&apos;une solution sur mesure ?{" "}
              <Link
                href="/contact"
                className="underline underline-offset-2 font-bold"
                onClick={() => {
                  handlePricingInteraction("custom_solution_clicked");
                }}
              >
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
