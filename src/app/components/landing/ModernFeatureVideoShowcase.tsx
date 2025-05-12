"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeatureShowcaseProps {
  features: {
    id: string;
    title: string;
    description: string;
    images: string[]; // Plusieurs images pour créer l'animation
    icon?: React.ReactNode;
    color?: string;
  }[];
}

export default function ModernFeatureShowcase({
  features,
}: FeatureShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeFeature = features[activeIndex];

  // Détecter si l'utilisateur est sur mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Animation automatique des images
  useEffect(() => {
    // Nettoyer l'animation précédente
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    // Démarrer l'animation automatique
    if (!isAnimating && activeFeature.images.length > 1) {
      setIsAnimating(true);

      animationTimerRef.current = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % activeFeature.images.length);
      }, 1000); // Changer d'image toutes les 1 secondes
    }

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [activeIndex, activeFeature.images.length, isAnimating]);

  // Gestion du swipe sur mobile
  useEffect(() => {
    if (!showcaseRef.current || !isMobile) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const minSwipeDistance = 50;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    };

    const container = showcaseRef.current;
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
    setActiveImageIndex(0);
    resetAnimation();
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
    setActiveImageIndex(0);
    resetAnimation();
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  };

  const selectFeature = (index: number) => {
    setActiveIndex(index);
    setActiveImageIndex(0);
    resetAnimation();
  };

  return (
    <div
      ref={showcaseRef}
      className="w-full max-w-7xl mx-auto bg-[#f5f3ef] rounded-3xl overflow-hidden border border-[#beac93] shadow-xl"
    >
      <div className="flex flex-col md:flex-row">
        {/* Section pour les images - 60% sur desktop */}
        <div className="md:w-3/5 bg-[#19140d] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeFeature.id}-${activeImageIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full relative"
              style={{ aspectRatio: "16/9" }}
            >
              {/* Image actuelle */}
              <Image
                src={activeFeature.images[activeImageIndex]}
                alt={`${activeFeature.title} - étape ${activeImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-contain"
                priority={activeIndex === 0 && activeImageIndex === 0}
              />

              {/* Superposition avec titre et info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-6">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-2xl font-bold text-white mb-2"
                >
                  {activeFeature.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-sm md:text-base text-white/80 mb-4 max-w-2xl line-clamp-2 md:line-clamp-none"
                >
                  {activeFeature.description}
                </motion.p>

                {/* Indicateurs d'étapes */}
                <div className="flex space-x-2 mb-2">
                  {activeFeature.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeImageIndex === idx
                          ? "w-8 bg-[#d9840d]"
                          : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation sur desktop */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4 pointer-events-none hidden md:flex">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors pointer-events-auto"
                  aria-label="Fonctionnalité précédente"
                >
                  <ChevronLeft size={20} className="mx-auto" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors pointer-events-auto"
                  aria-label="Fonctionnalité suivante"
                >
                  <ChevronRight size={20} className="mx-auto" />
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Panneau latéral avec les fonctionnalités */}
        <div className="md:w-2/5 bg-[#f2e8d9] p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="hidden md:block">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 text-[#141313]">
              Découvrez nos fonctionnalités
            </h3>
          </div>

          {/* Liste des fonctionnalités - version desktop */}
          <div className="hidden md:flex flex-col space-y-4 mb-6 flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  activeIndex === index
                    ? "bg-[#d9840d] text-white shadow-md"
                    : "bg-white hover:bg-[#e8ebe0]"
                }`}
                onClick={() => selectFeature(index)}
                whileHover={{ x: activeIndex === index ? 0 : 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <h4 className="font-medium text-lg mb-1">{feature.title}</h4>
                <p
                  className={`text-sm ${activeIndex === index ? "text-white/90" : "text-[#62605d]"}`}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Version mobile - liste horizontale scrollable des caractéristiques */}
          <div className="md:hidden py-4 w-full">
            <div className="flex overflow-x-auto touch-pan-x pb-4 -mx-4 px-4 space-x-3 scrollbar-hide">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={`flex-shrink-0 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    activeIndex === index
                      ? "bg-[#d9840d] text-white shadow-md"
                      : "bg-white border border-[#beac93]/30"
                  }`}
                  style={{ width: "200px" }}
                  onClick={() => selectFeature(index)}
                  whileTap={{ scale: 0.97 }}
                >
                  <h4 className="font-medium text-sm mb-1 truncate">
                    {feature.title}
                  </h4>
                  <p
                    className={`text-xs ${activeIndex === index ? "text-white/90" : "text-[#62605d]"} line-clamp-2`}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Navigation sur desktop */}
          <div className="hidden md:flex justify-between items-center mt-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#141313] hover:bg-[#d9840d] hover:text-white transition-colors"
              aria-label="Fonctionnalité précédente"
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div className="flex space-x-1">
              {features.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => selectFeature(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeIndex === idx ? "w-6 bg-[#d9840d]" : "bg-[#beac93]"
                  }`}
                  aria-label={`Voir fonctionnalité ${idx + 1}`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#141313] hover:bg-[#d9840d] hover:text-white transition-colors"
              aria-label="Fonctionnalité suivante"
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
