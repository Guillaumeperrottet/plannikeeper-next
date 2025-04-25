"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Header from "@/app/components/landing/Header"; // Assurez-vous d'ajuster le chemin si nécessaire
import TiltedCarousel from "@/app/components/landing/DualDirectionCarousel";

const ModernLandingPage = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);

  const isHeroInView = useInView(heroRef, { amount: 0.5 });
  const isFeaturesInView = useInView(featuresRef, { amount: 0.5 });
  const isPricingInView = useInView(pricingRef, { amount: 0.5 });

  useEffect(() => {
    if (isHeroInView) setActiveSection("hero");
    else if (isFeaturesInView) setActiveSection("features");
    else if (isPricingInView) setActiveSection("pricing");
  }, [isHeroInView, isFeaturesInView, isPricingInView]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  };

  const features = [
    {
      title: "Suivi simplifié",
      description: "Gérez vos tâches et documents en un seul endroit",
      icon: "📊",
      color: "bg-blue-500",
    },
    {
      title: "Interface intuitive",
      description: "Naviguez facilement entre vos projets immobiliers",
      icon: "🏡",
      color: "bg-green-500",
    },
    {
      title: "Collaboration",
      description: "Partagez les informations avec votre équipe en temps réel",
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      title: "Documentation",
      description: "Gardez tous vos documents organisés et accessibles",
      icon: "📄",
      color: "bg-amber-500",
    },
  ];

  const plans = [
    {
      name: "Standard",
      price: "$4999/m",
      features: [
        "Un feature request à la fois",
        "Pause ou annulation à tout moment",
        "Support technique",
      ],
      color: "from-gray-700 to-gray-900",
      textColor: "text-white",
      buttonColor: "bg-orange-500 hover:bg-orange-600",
    },
    {
      name: "Goblin+",
      price: "$9999/m",
      features: [
        "Mode goblin - plus rapide que votre équipe",
        "Plusieurs features en parallèle",
        "Support prioritaire 24/7",
      ],
      color: "from-orange-400 to-orange-600",
      textColor: "text-white",
      buttonColor: "bg-gray-900 hover:bg-gray-800",
      popular: true,
    },
  ];

  const firstCarouselImages = [
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy5.png", alt: "Feature 2" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
  ];

  const secondCarouselImages = [
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
    { src: "/images/plannikeeper1copy4.png", alt: "Feature 1" },
  ];

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">
      {/* Nouveau Header avec effet de scroll */}
      <Header />

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="min-h-screen relative flex items-center overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #C74A12 100%)",
        }}
      >
        <div className="container mx-auto px-6 pt-24 z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left w-full md:w-2/3"
          >
            <h1 className="text-[5rem] md:text-[6rem] font-extrabold leading-none text-gray-900 mb-6">
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Organisation
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="font-normal"
              >
                Gestion
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.4,
                  type: "spring",
                  stiffness: 200,
                }}
                className="align-middle dot-pattern"
                style={{
                  fontFamily: "'VT323', monospace",
                  letterSpacing: "0.05em",
                  fontWeight: 700,
                  fontSize: "1em",
                  display: "inline-block",
                }}
              >
                Planification
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-800 mb-8 max-w-2xl"
            >
              Simplifiez la gestion de vos projets immobiliers avec notre
              solution tout-en-un.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <button
                onClick={() => scrollToSection("features")}
                className="px-8 py-3 bg-[#C74A12] text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-orange-800 hover:shadow-lg transform hover:scale-105"
              >
                Découvrir
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Animated blobs */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute -right-32 top-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-white to-orange-200 blur-3xl z-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.6 }}
          className="absolute left-1/4 bottom-1/4 w-72 h-72 rounded-full bg-gradient-to-br from-orange-100 to-orange-300 blur-3xl z-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.9 }}
          className="absolute right-1/3 top-1/4 w-64 h-64 rounded-full bg-white blur-3xl z-0"
        />
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-24 bg-white z-10 relative"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Notre application offre tous les outils nécessaires pour gérer
              efficacement vos projets immobiliers, vos tâches et vos documents.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10 }}
                className="bg-white p-6 rounded-2xl shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div
                  className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-2xl text-white mb-5`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
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
            <button
              onClick={() => scrollToSection("pricing")}
              className="px-8 py-3 bg-black text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-gray-800 hover:shadow-lg transform hover:scale-105"
            >
              Voir nos forfaits
            </button>
          </motion.div>
        </div>
      </section>

      {/* Section Carousel */}
      <section className="py-24 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Quelques Snippets</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Découvrez notre plateforme à travers ces aperçus.
            </p>
          </motion.div>

          {/* Conteneur des deux carousels avec hauteur fixe */}
          <div className="relative" style={{ height: "850px" }}>
            {/* Premier carousel - positionné en haut */}
            <div className="absolute top-0 left-0 w-full">
              <TiltedCarousel
                className="h-auto"
                images={firstCarouselImages}
                speed={40}
                tiltAngle={-10}
                scale={1.3} // Échelle légèrement réduite
                imageWidth={330}
                imageHeight={250}
                borderWidth={3}
                pauseOnHover={false}
                gap={30}
                direction="left"
              />
            </div>
            {/* Second carousel - positionné plus bas */}
            <div className="absolute top-[400px] left-0 w-full">
              <TiltedCarousel
                className="h-auto"
                images={secondCarouselImages}
                speed={30}
                tiltAngle={-10}
                scale={1.3}
                imageWidth={330}
                imageHeight={250}
                borderWidth={3}
                pauseOnHover={false}
                gap={30}
                direction="left"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        ref={pricingRef}
        className="py-24 bg-black text-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Memberships levels</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Choose a plan that&apos;s right for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`rounded-2xl overflow-hidden transition-all duration-300 relative ${
                  plan.popular ? "border-2 border-orange-500" : ""
                }`}
              >
                <div
                  className={`p-8 bg-gradient-to-br ${plan.color} ${plan.textColor}`}
                >
                  {plan.popular && (
                    <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAIRE
                    </span>
                  )}

                  <h3 className="text-2xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-5xl font-bold mb-4">{plan.price}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        {feature}
                      </motion.li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-xl font-bold text-lg ${plan.buttonColor} transition-all duration-300 hover:shadow-lg transform hover:scale-105`}
                  >
                    start <span className="ml-2">↗</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Frequently asked</h2>
            <h2 className="text-4xl font-bold dot-pattern">questions.</h2>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <FaqItem
              question="Why not just hire a full-time design engineer?"
              answer="Hiring a full-time employee comes with overhead costs like benefits, onboarding, and management. Our service provides specialized expertise on-demand without the commitment of a full-time hire, allowing you to scale resources up or down as needed."
            />

            <FaqItem
              question="Is there a limit to how many requests I can have?"
              answer="This depends on your plan. The Standard plan allows one feature request at a time, while the Goblin+ plan enables multiple parallel requests for faster development and implementation."
            />

            <FaqItem
              question="How long will it take to build a full stack feature?"
              answer="Timeframes vary depending on the complexity of the feature. Simple features might take days, while more complex ones could take weeks. We provide estimates before beginning work and keep you updated throughout the process."
            />

            <FaqItem
              question="What if I want a different tech stack?"
              answer="We're flexible and can work with various tech stacks. During our initial consultation, we'll discuss your preferences and recommend the best approach for your specific needs and long-term goals."
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-3xl font-bold tracking-widest font-mono mb-6 md:mb-0">
              plannikeeper
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <a href="#" className="hover:text-orange-400 transition-colors">
                Accueil
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                Fonctionnalités
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                Tarifs
              </a>
              <a href="#" className="hover:text-orange-400 transition-colors">
                Contact
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Plannikeeper. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// FAQ Item Component
interface FaqItemProps {
  question: string;
  answer: string;
}

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
      className="border-b border-gray-200 pb-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none"
      >
        <h3 className="text-xl font-semibold">{question}</h3>
        <svg
          className={`w-6 h-6 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-gray-600 mt-4">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernLandingPage;
