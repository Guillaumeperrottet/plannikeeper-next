"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/components/landing/Header";
import Footer from "@/app/components/landing/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Bouton retour fixe */}
      <Link
        href="/"
        className="fixed top-20 left-6 z-40 flex items-center gap-2 text-gray-600 hover:text-[#d9840d] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Retour</span>
      </Link>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            À propos de PlanniKeeper
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Une solution développée par{" "}
            <a
              href="https://www.webbing.ch/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d9840d] hover:underline font-semibold"
            >
              Webbing
            </a>{" "}
            pour simplifier la gestion immobilière des professionnels.
          </p>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                La petite histoire
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  PlanniKeeper est né d&apos;un constat simple : la gestion
                  quotidienne des biens immobiliers, qu&apos;il s&apos;agisse de
                  campings, d&apos;hôtels ou d&apos;immeubles, manque
                  d&apos;outils vraiment adaptés au terrain.
                </p>
                <p>
                  Trop souvent, les professionnels jonglent entre des fichiers
                  Excel éparpillés, des notes manuscrites et des outils
                  génériques qui ne comprennent pas leurs besoins spécifiques.
                </p>
                <div className="bg-white p-6 rounded-lg border-l-4 border-[#d9840d] mt-6">
                  <p className="text-gray-700 italic">
                    &quot;En collaboration avec Webbing, nous avons pu
                    développer un outil qui répond exactement à nos besoins
                    quotidiens. Finies les tâches dispersées et les documents
                    perdus : tout est centralisé et accessible en quelques
                    clics.&quot;
                  </p>
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    — Camping Potentille SA
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl border border-gray-200">
              <Image
                src="/images/camping-hotel-collage.jpg"
                alt="Gestion de campings et hôtels"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Notre mission
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#d9840d]/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Simplicité
              </h3>
              <p className="text-gray-600">
                Une interface intuitive accessible à tous, sans formation
                complexe.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#d9840d]/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Efficacité
              </h3>
              <p className="text-gray-600">
                Automatiser les tâches répétitives pour vous concentrer sur
                l&apos;essentiel.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#d9840d]/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Évolution
              </h3>
              <p className="text-gray-600">
                En constante amélioration grâce à vos retours et suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Webbing */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 md:p-10 rounded-lg border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Développé par Webbing
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Une entreprise suisse spécialisée dans la création de solutions
              SaaS innovantes et accessibles.
            </p>
            <a
              href="https://www.webbing.ch/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-[#d9840d] rounded-lg hover:bg-[#c6780c] transition-colors"
            >
              Découvrir Webbing
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
