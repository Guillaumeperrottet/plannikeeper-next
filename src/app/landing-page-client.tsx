"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Header from "@/app/components/landing/Header";
import PricingSection from "@/app/components/landing/Pricing";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Check } from "lucide-react";
import React from "react";
import CampingFeatureShowcase from "@/app/components/landing/CampingFeatureShowcase";

const ModernLandingPage = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const showcaseRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  const features = [
    {
      title: "Visualisation interactive",
      description:
        "Naviguez intuitivement à travers vos biens immobiliers avec notre interface interactive",
      icon: "/images/map-pin.svg",
      color: "bg-[#d9840d]",
    },
    {
      title: "Gestion des tâches",
      description:
        "Planifiez et suivez toutes vos tâches avec notre système intégré d'organisation",
      icon: "/images/calendar.svg",
      color: "bg-[#c6780c]",
    },
    {
      title: "Mode collaboratif",
      description:
        "Partagez les informations avec votre équipe en temps réel pour une coordination parfaite",
      icon: "/images/users.svg",
      color: "bg-[#e36002]",
    },
    {
      title: "Centralisation documentaire",
      description:
        "Gardez tous vos documents organisés et accessibles en un seul endroit",
      icon: "/images/file.svg",
      color: "bg-[#b8a589]",
    },
  ];

  const faqs = [
    {
      question:
        "Comment PlanniKeeper m'aide-t-il à gérer mes biens immobiliers ?",
      answer:
        "PlanniKeeper centralise toutes les informations relatives à vos biens immobiliers, vous permettant de visualiser vos propriétés, programmer des tâches de maintenance, stocker des documents importants et collaborer avec votre équipe, le tout dans une interface intuitive et personnalisable.",
    },
    {
      question: "Puis-je accéder à PlanniKeeper sur mobile ?",
      answer:
        "Absolument ! PlanniKeeper est entièrement responsive et s'adapte parfaitement aux smartphones et tablettes. Vous pouvez ainsi gérer vos propriétés où que vous soyez, directement depuis votre appareil mobile.",
    },
    {
      question:
        "Est-ce que PlanniKeeper est adapté aux grandes agences immobilières ?",
      answer:
        "Oui, notre forfait Professionnel est spécialement conçu pour répondre aux besoins des grandes structures avec des propriétés illimitées, une collaboration multi-utilisateurs et des fonctionnalités avancées de reporting.",
    },
    {
      question: "Comment fonctionne la visualisation interactive des biens ?",
      answer:
        "Notre système permet de créer une représentation visuelle de chaque propriété. Vous pouvez ajouter des plans, marquer des zones d'intérêt spécifiques et associer des tâches ou documents à des emplacements précis, rendant la navigation et la gestion intuitive et contextuelle.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f3ec] text-[#141313] overflow-hidden">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="min-h-screen relative flex items-center overflow-hidden pt-16 md:pt-0"
      >
        <div
          className="absolute inset-0 w-full h-full -z-10 bg-gradient-to-b from-[#f9f3ec] via-[#f5f3ef] to-[#d9840d]/30"
          aria-hidden="true"
        />

        <div className="container mx-auto px-4 sm:px-6 pt-8 md:pt-24 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <motion.div
                className="inline-block bg-[#e8ebe0] px-4 py-1 rounded-full mb-6 border border-[#beac93]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-[#62605d] font-medium text-sm">
                  Gestion immobilière simplifiée
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-[#141313] mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="block"
                >
                  Organisez.
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="block"
                >
                  Planifiez.
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="block text-[#d9840d]"
                >
                  Maîtrisez.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="text-lg md:text-xl text-[#62605d] mb-8 max-w-2xl"
              >
                Simplifiez la gestion de vos projets immobiliers avec notre
                solution tout-en-un, conçue pour optimiser votre temps et
                maximiser votre efficacité.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/signup?plan=FREE">
                  <Button className="w-full sm:w-auto px-6 py-6 text-base bg-[#d9840d] hover:bg-[#c6780c] text-white">
                    Commencer gratuitement
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  {" "}
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-6 text-base border-[#beac93] text-[#141313] hover:bg-[#e8ebe0]"
                  >
                    A propos de nous
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[600px]">
                <div className="absolute top-0 right-0 w-full h-full bg-[#d9840d]/10 rounded-2xl transform rotate-3"></div>
                <div className="absolute top-4 right-4 w-full h-full overflow-hidden rounded-2xl border-2 border-[#beac93] shadow-xl bg-white">
                  <Image
                    src="/images/hero.png"
                    alt="PlanniKeeper Dashboard"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute -top-6 -left-6 bg-white p-4 rounded-lg shadow-lg border border-[#beac93] z-10 flex items-center gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  <div className="w-10 h-10 bg-[#d9840d] rounded-full flex items-center justify-center text-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#62605d]">Cette semaine</p>
                    <p className="font-medium">8 tâches terminées</p>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -bottom-6 right-12 bg-white p-4 rounded-lg shadow-lg border border-[#beac93] z-10"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  <p className="text-xs text-[#62605d]">Progression globale</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                    <div className="w-3/4 h-2 bg-[#d9840d] rounded-full"></div>
                  </div>
                  <p className="text-right text-xs font-medium mt-1">75%</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-16 left-0 w-full h-32 bg-gradient-to-b from-transparent to-[#f9f3ec]/80 z-10"></div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute -right-32 top-1/4 w-64 md:w-96 h-64 md:h-96 rounded-full bg-gradient-to-br from-[#f5f3ef] to-[#d9840d]/30 blur-3xl z-0"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="absolute left-1/4 bottom-1/4 w-48 md:w-72 h-48 md:h-72 rounded-full bg-gradient-to-br from-[#e8ebe0] to-[#beac93]/30 blur-3xl z-0"
        />
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-20 md:py-32 bg-[#f9f3ec] z-10 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16 md:mb-20"
          >
            <div className="inline-block bg-[#e8ebe0] px-4 py-1 rounded-full mb-4 border border-[#beac93]">
              <span className="text-[#62605d] font-medium text-sm">
                Fonctionnalités principales
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
              Finis les fichiers excel et les notes éparpillées !
            </h2>
            <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
              Notre application offre tous les outils nécessaires pour gérer
              efficacement vos projets immobiliers, vos tâches et vos documents,
              le tout dans une interface intuitive et élégante.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-2xl shadow-xl transition-all duration-300 border border-[#beac93] hover:border-[#d9840d]"
              >
                <div
                  className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6`}
                >
                  {feature.icon && (
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      width={32}
                      height={32}
                    />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[#141313]">
                  {feature.title}
                </h3>
                <p className="text-[#62605d]">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 text-center"
          >
            <Link href="/signup?plan=FREE">
              <Button className="w-full sm:w-auto px-6 py-6 text-base bg-[#d9840d] hover:bg-[#c6780c] text-white">
                Commencer maintenant
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Showcase Section - Version immersive pour campings */}
      <section
        id="showcase"
        ref={showcaseRef}
        className="py-16 md:pt-24 pb-32 overflow-hidden relative"
      >
        {/* Fond naturel adapté aux campings */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#f9f8f4] to-[#e8f1e8] opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-20"
          >
            <div className="inline-block bg-[#e9c46a]/20 px-4 py-1 rounded-full mb-4 border border-[#e9c46a]/30">
              <span className="text-[#e76f51] font-medium text-sm">
                L&apos;essentiel de PlanniKeeper
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
              Découvrez les fonctionnalités clés
            </h2>
            <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
              Notre solution transforme votre gestion quotidienne. Voyez comment
              PlanniKeeper peut faire la différence.
            </p>
          </motion.div>

          {/* Composant de fonctionnalités vidéo immersif pour campings */}
          <CampingFeatureShowcase />
        </div>
      </section>

      {/* For Whom Section */}
      <section className="py-16 md:py-24 bg-[#f9f3ec] text-[#141313] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-[#d9840d]/10 px-4 py-2 rounded-full mb-6 border border-[#d9840d]/20">
              <span className="text-[#d9840d] font-medium text-sm">
                Qui peut utiliser PlanniKeeper
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Pour qui ?</h2>
            <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
              PlanniKeeper s&apos;adapte à différents profils professionnels de
              l&apos;immobilier, offrant une solution personnalisée selon vos
              besoins.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Agences immobilières */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-[#d9840d] to-[#e36002] rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white p-8 rounded-xl border border-[#beac93] group-hover:border-[#d9840d] transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-[#d9840d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#141313]">
                    Agences immobilières
                  </h3>
                  <p className="text-[#62605d] mb-6">
                    Gestion optimisée du portefeuille complet avec collaboration
                    d&apos;équipe avancée.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Gestion de portefeuille
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Collaboration multi-agents
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Reporting automatisé
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Propriétaires de biens */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-[#d9840d] to-[#e36002] rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white p-8 rounded-xl border border-[#beac93] group-hover:border-[#d9840d] transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-[#d9840d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#141313]">
                    Propriétaires de biens
                  </h3>
                  <p className="text-[#62605d] mb-6">
                    Gérez tous vos biens immobiliers avec simplicité et
                    efficacité.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Campings & villages vacances
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Hôtels & résidences
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Immeubles & patrimoines
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Indépendants */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-[#d9840d] to-[#e36002] rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-white p-8 rounded-xl border border-[#beac93] group-hover:border-[#d9840d] transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#d9840d]/10 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-[#d9840d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#141313]">
                    Indépendants
                  </h3>
                  <p className="text-[#62605d] mb-6">
                    Solution légère et efficace pour les professionnels en solo.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Organisation personnelle
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Interface simplifiée
                  </li>
                  <li className="flex items-center text-sm text-[#62605d]">
                    <div className="w-1.5 h-1.5 bg-[#d9840d] rounded-full mr-3"></div>
                    Prix adapté aux freelances
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Et bien plus message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-block bg-[#d9840d]/5 px-8 py-4 rounded-full border border-[#d9840d]/20">
              <span className="text-xl font-medium text-[#d9840d] italic">
                Et bien plus encore...
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <div id="pricing" ref={pricingRef}>
        <PricingSection />
      </div>

      {/* FAQ Section */}
      <section
        id="faq"
        ref={faqRef}
        className="py-20 md:py-32 bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-[#e8ebe0] px-4 py-1 rounded-full mb-4 border border-[#beac93]">
              <span className="text-[#62605d] font-medium text-sm">
                Questions fréquentes
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#141313]">
              Besoin d&apos;aide ?
            </h2>
            <p className="text-lg text-[#62605d] max-w-3xl mx-auto">
              Voici les réponses aux questions les plus fréquemment posées par
              nos utilisateurs.
            </p>
          </motion.div>

          <motion.div
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {faqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 text-center"
          >
            <p className="text-lg text-[#62605d] mb-6">
              Vous avez d&apos;autres questions ? Contactez-nous directement.
            </p>
            <Link href="/contact">
              <Button
                variant="outline"
                className="px-8 py-4 border-[#beac93] text-[#141313] hover:bg-[#e8ebe0] text-base"
              >
                Contacter nous
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-[#d9840d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à optimiser votre gestion immobilière ?
              </h2>
              <p className="text-lg text-white/90 max-w-2xl">
                Rejoignez des milliers de professionnels qui ont déjà transformé
                leur façon de travailler.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup?plan=FREE">
                <Button className="w-full sm:w-auto px-6 py-6 text-base bg-[#d9840d] hover:bg-[#c6780c] text-white">
                  Commencer maintenant
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#19140d] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 font-mono">
                plannikeeper
              </h3>
              <p className="text-gray-400 mb-4 max-w-md">
                La solution complète pour la gestion immobilière
                professionnelle. Simplifiez vos opérations et optimisez votre
                temps.
              </p>
              {/* logo instagram etc à décommenter si besoin... */}
              {/* <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div> */}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-[#d9840d]"
                  >
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 hover:text-[#d9840d]"
                  >
                    Tarifs
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                    Témoignages
                  </a>
                </li> */}
                {/* <li>
                  <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                    Mises à jour
                  </a>
                </li> */}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/about"
                    className="text-gray-400 hover:text-[#d9840d]"
                  >
                    À propos
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-gray-400 hover:text-[#d9840d]"
                  >
                    Contact
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#d9840d]">
                    Blog
                  </a>
                </li> */}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} PlanniKeeper. Tous droits
              réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// FAQ Item Component
type FaqItemProps = {
  question: string;
  answer: string;
};

const FaqItem = ({ question, answer }: FaqItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      ref={contentRef}
      className="border border-[#beac93] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left p-6 focus:outline-none bg-white"
      >
        <h3 className="text-lg md:text-xl font-medium pr-8">{question}</h3>
        <span
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronRight className="w-5 h-5 transform rotate-90" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-[#f5f3ef]"
          >
            <p className="p-6 text-[#62605d]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernLandingPage;
