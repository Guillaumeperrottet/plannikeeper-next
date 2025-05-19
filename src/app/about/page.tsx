"use client";

import { motion } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

// Animations pour les entrées des éléments
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Données de team
const founder = {
  name: "Guillaume Perrottet",
  role: "Développeur",
  bio: "J'ai créé PlanniKeeper pour répondre aux défis spécifiques que nous avons rencontrés dans la gestion quotidienne de campings et d'hôtels. Combinant notre expertise dans ces deux domaines, je développe et améliore continuellement cette solution pour la rendre toujours plus intuitive et efficace.",
  image: "/images/guillaume-perrottet.jpg",
};

// Historique
const milestones = [
  {
    year: "2023",
    title: "Naissance de l'idée",
    description:
      "Face aux défis de gestion de 3 campings et 1 hôtel, l'idée de PlanniKeeper émerge comme solution à un besoin concret.",
  },
  {
    year: "2024",
    title: "Développement de PlanniKeeper",
    description:
      "Création d'une première version fonctionnelle adaptée spécifiquement aux besoins des établissements d'hébergement touristique.",
  },
  {
    year: "202",
    title: "Lancement officiel",
    description:
      "Après des tests approfondis en conditions réelles, PlanniKeeper est proposé à d'autres professionnels du secteur.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9f3ec] to-[#f5f3ef]">
      {/* Flèche de retour en haut à gauche */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 transition-colors border border-gray-200"
      >
        <ArrowLeft className="w-5 h-5 text-[color:var(--primary)]" />
        <span className="sr-only">Retour</span>
      </Link>
      {/* Hero section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[color:var(--primary)]/10 px-4 py-1 rounded-full mb-4 border border-[color:var(--primary)]/20">
            <span className="text-[color:var(--primary)] font-medium text-sm">
              À propos de PlanniKeeper
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            L&apos;histoire derrière le projet
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Comment un défi personnel dans la gestion de campings et
            d&apos;hôtels a donné naissance à PlanniKeeper.
          </p>
        </motion.div>

        {/* Section de présentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Pourquoi PlanniKeeper
            </h2>
            <p className="text-gray-600 mb-6">
              PlanniKeeper est né d&apos;un besoin concret. Pour la maintenance
              de trois campings et d&apos;un hôtel, nous avons rapidement
              constaté que les outils existants ne répondaient pas aux défis
              spécifiques de ces établissements : planification de la
              maintenance, suivi des tâches, centralisation des documents...
            </p>
            <p className="text-gray-600 mb-6">
              Passionné par la technologie et l&apos;optimisation des processus,
              j&apos;ai décidé de créer ma propre solution. PlanniKeeper a
              d&apos;abord été développé pour notre usage personnel, avec
              l&apos;objectif de simplifier notre quotidien. C&apos;est en
              voyant les résultats concrets - gain de temps, réduction des
              erreurs, meilleure communication - que j&apos;ai réalisé que cette
              solution pourrait aider d&apos;autres professionnels du secteur.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href="/contact">
                <Button className="bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[color:var(--primary)]/10 rounded-2xl transform rotate-3"></div>
              <div className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-[color:var(--primary)]/20">
                <Image
                  src="/images/camping-hotel-collage.jpg"
                  alt="Les campings et hôtels qui utilisent PlanniKeeper"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section Fondateur */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Derrière PlanniKeeper
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Un projet développé avec passion
            </p>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center text-center max-w-2xl"
            >
              <div className="w-32 h-32 relative rounded-full overflow-hidden mb-6 border-4 border-[color:var(--primary)]/20">
                <Image
                  src={founder.image}
                  alt={founder.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                {founder.name}
              </h3>
              <p className="text-[color:var(--primary)] font-medium mb-6">
                {founder.role}
              </p>
              <p className="text-gray-600">{founder.bio}</p>
              <p className="text-gray-600 mt-4">
                &quot;Je crois fermement que la technologie doit servir
                l&apos;humain, pas l&apos;inverse. C&apos;est pourquoi
                PlanniKeeper a été conçu pour être intuitif, adapté à la réalité
                du terrain, et en constante évolution selon les retours des
                utilisateurs.&quot;
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Section Jalons */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Notre parcours
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Plannikeeper est un projet récent. Et donc a la pointe de la
              technologie actuelle et surtout en constante amélioration.
            </p>
          </div>

          <div className="relative">
            {/* Ligne de temps verticale */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[color:var(--primary)]/20"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row items-center ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div
                    className={`md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}
                  >
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                      <p className="text-[color:var(--primary)] font-bold mb-2">
                        {milestone.year}
                      </p>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--primary)] text-white font-bold relative z-10 my-4 md:my-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="md:w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Appel à l'action */}
      <section className="py-16 bg-[color:var(--primary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Prêt à transformer la gestion de votre établissement ?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-3xl mx-auto">
            Découvrez comment PlanniKeeper peut simplifier votre quotidien et
            améliorer l&apos;efficacité de vos opérations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-[color:var(--primary)]/80"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
