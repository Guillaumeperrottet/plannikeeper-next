"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/app/components/landing/Header";
import Footer from "@/app/components/landing/Footer";

export default function LandingSimple() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Tracking handlers
  const handleSignupClick = (plan: string, location: string) => {
    track("signup_clicked", {
      plan,
      location,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAboutClick = (location: string) => {
    track("about_us_clicked", {
      location,
      timestamp: new Date().toISOString(),
    });
  };

  const handleContactClick = (location: string) => {
    track("contact_clicked", {
      location,
      timestamp: new Date().toISOString(),
    });
  };

  // Features data
  const features = [
    {
      title: "Visualisation interactive",
      description: "Naviguez intuitivement à travers vos biens immobiliers",
      icon: "🗺️",
    },
    {
      title: "Gestion des tâches",
      description: "Planifiez et suivez toutes vos tâches efficacement",
      icon: "✓",
    },
    {
      title: "Mode collaboratif",
      description: "Partagez les informations avec votre équipe en temps réel",
      icon: "👥",
    },
    {
      title: "Centralisation documentaire",
      description: "Tous vos documents organisés en un seul endroit",
      icon: "📁",
    },
  ];

  // Plans data
  const plans = [
    {
      id: "FREE",
      name: "Gratuit",
      description: "Pour découvrir",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "1 utilisateur",
        "1 objet",
        "500MB stockage",
        "Support communauté",
      ],
    },
    {
      id: "PERSONAL",
      name: "Particulier",
      description: "Pour la gestion personnelle",
      monthlyPrice: 12,
      yearlyPrice: 120,
      features: ["1 utilisateur", "1 objet", "2GB stockage", "Support email"],
    },
    {
      id: "PROFESSIONAL",
      name: "Professionnel",
      description: "Pour les indépendants",
      monthlyPrice: 50,
      yearlyPrice: 500,
      features: [
        "5 utilisateurs",
        "3 objets",
        "10GB stockage",
        "Support prioritaire",
      ],
      popular: true,
    },
    {
      id: "CUSTOM",
      name: "Sur mesure",
      description: "Solution personnalisée",
      monthlyPrice: null,
      yearlyPrice: null,
      features: [
        "Utilisateurs illimités",
        "Objets illimités",
        "Stockage illimité",
        "Support dédié",
      ],
      isCustom: true,
    },
  ];

  // FAQ data
  const faqs = [
    {
      question:
        "Comment Plannikeeper m'aide-t-il à gérer mes biens immobiliers ?",
      answer:
        "Plannikeeper centralise toutes les informations relatives à vos biens immobiliers, vous permettant de visualiser vos propriétés, programmer des tâches de maintenance, stocker des documents importants et collaborer avec votre équipe.",
    },
    {
      question: "Puis-je accéder à Plannikeeper sur mobile ?",
      answer:
        "Oui, Plannikeeper est entièrement responsive et s'adapte parfaitement aux smartphones et tablettes.",
    },
    {
      question:
        "Est-ce que Plannikeeper est adapté aux grandes agences immobilières ?",
      answer:
        "Oui, notre forfait Professionnel est spécialement conçu pour répondre aux besoins des grandes structures avec des propriétés illimitées et une collaboration multi-utilisateurs.",
    },
    {
      question: "Comment fonctionne la visualisation interactive des biens ?",
      answer:
        "Notre système permet de créer une représentation visuelle de chaque propriété. Vous pouvez ajouter des plans, marquer des zones d'intérêt et associer des tâches à des emplacements précis.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-32 px-4 sm:px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="block">Organisez.</span>
                <span className="block">Planifiez.</span>
                <span className="block text-[#d9840d]">Maîtrisez.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                La solution tout-en-un pour gérer efficacement vos propriétés,
                tâches et documents dans une interface intuitive.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup?plan=FREE"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#d9840d] rounded-lg hover:bg-[#c6780c] transition-colors"
                  onClick={() => handleSignupClick("FREE", "hero")}
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/#features"
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => handleAboutClick("hero")}
                >
                  En savoir plus
                </Link>
              </div>
            </div>

            {/* Right image */}
            <div className="relative">
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 hover:border-[#d9840d]/30 shadow-2xl bg-gray-50 transition-colors">
                <Image
                  src="/images/hero.png"
                  alt="Plannikeeper Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités principales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement vos projets
              immobiliers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-[#d9840d]/40 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choisissez le plan qui correspond à vos besoins
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-[#d9840d] text-white shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-[#d9840d] text-white shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Annuel
                <span className="ml-2 text-xs text-green-600">-15%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price =
                plan.monthlyPrice === null
                  ? null
                  : billingCycle === "yearly"
                    ? (plan.yearlyPrice || 0) / 12
                    : plan.monthlyPrice;
              const isPopular = plan.popular;
              const isCustom = plan.isCustom;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative bg-white p-6 rounded-lg border-2 transition-all ${
                    isPopular
                      ? "border-[#d9840d] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#d9840d] text-white text-xs font-medium px-3 py-1 rounded-full">
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {plan.description}
                    </p>
                    {isCustom ? (
                      <div className="text-2xl font-bold text-gray-900">
                        Sur devis
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900">
                            {Math.round(price!)} CHF
                          </span>
                          <span className="text-gray-600 ml-2">/mois</span>
                        </div>
                        {billingCycle === "yearly" &&
                          plan.yearlyPrice &&
                          plan.yearlyPrice > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              Facturé {plan.yearlyPrice} CHF/an
                            </p>
                          )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPopular ? "text-[#d9840d]" : "text-gray-900"}`}
                        />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={isCustom ? "/contact" : `/signup?plan=${plan.id}`}
                    className={`block w-full text-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      isPopular
                        ? "bg-[#d9840d] text-white hover:bg-[#c6780c]"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleSignupClick(plan.id, "pricing")}
                  >
                    {isCustom ? "Nous contacter" : "Choisir ce plan"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur Plannikeeper
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 hover:border-[#d9840d]/30 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-medium text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <span className="text-2xl text-[#d9840d]">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Vous avez d&apos;autres questions ?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => handleContactClick("faq")}
            >
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      <Footer
        onAboutClick={handleAboutClick}
        onContactClick={handleContactClick}
      />
    </div>
  );
}
