"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface VideoFeature {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
  poster?: string;
}

interface VideoShowcaseProps {
  features: VideoFeature[];
}

export default function FeatureVideoShowcase({ features }: VideoShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Initialiser les refs pour chaque vidéo
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, features.length);
  }, [features]);

  // Gérer la lecture/pause de la vidéo active
  useEffect(() => {
    // Pause toutes les vidéos
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });

    // Lecture de la vidéo active si nécessaire
    const activeVideo = videoRefs.current[activeIndex];
    if (activeVideo) {
      if (isPlaying) {
        activeVideo.play().catch((e) => {
          console.error("Erreur lors de la lecture de la vidéo:", e);
          setIsPlaying(false);
        });
      } else {
        activeVideo.pause();
      }
    }
  }, [activeIndex, isPlaying]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const selectFeature = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  };

  // Effet de reconnaissance du swipe sur mobile
  useEffect(() => {
    if (!containerRef.current || !isMobile) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      // Minimum swipe distance (en pixels)
      const minSwipeDistance = 50;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          handlePrev(); // Swipe droite
        } else {
          handleNext(); // Swipe gauche
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-7xl mx-auto bg-[#f5f3ef] rounded-3xl overflow-hidden border border-[#beac93] shadow-xl"
    >
      {/* Layout adaptatif selon l'appareil */}
      <div className="flex flex-col md:flex-row">
        {/* Section vidéo - occupe tout l'espace sur mobile, 60% sur desktop */}
        <div className="md:w-3/5 bg-[#19140d] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full relative"
              style={{ aspectRatio: "16/9" }} // Forcer le format 16:9
            >
              {features.map((feature, idx) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 ${activeIndex === idx ? "block" : "hidden"}`}
                >
                  {/* Fallback sur une image de poster si la vidéo ne se charge pas ou sur mobile à faible bande passante */}
                  {feature.poster && (
                    <Image
                      src={feature.poster}
                      alt={feature.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className={`object-cover ${isPlaying ? "opacity-0" : "opacity-100"}`}
                      priority={idx === activeIndex}
                    />
                  )}

                  {/* ===== SOLUTION À L'ESPACE NOIR ===== */}
                  {/* Ajout du conteneur avec position relative pour maintenir les proportions */}
                  <div className="relative w-full h-full bg-[#19140d]">
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={feature.videoSrc}
                      poster={feature.poster}
                      className="absolute inset-0 w-full h-full object-contain" // object-contain au lieu de object-cover
                      playsInline
                      loop
                      muted
                      preload={idx === activeIndex ? "auto" : "none"}
                    />
                  </div>
                  {/* ===== FIN DE LA SOLUTION ===== */}
                </div>
              ))}

              {/* Superposition avec titre et contrôles - adapté pour mobile */}
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

                <div className="flex items-center justify-between">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlayPause}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#d9840d] text-white flex items-center justify-center hover:bg-[#c6780c] transition-colors"
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                  >
                    {isPlaying ? (
                      <Pause size={isMobile ? 16 : 20} />
                    ) : (
                      <Play size={isMobile ? 16 : 20} className="ml-1" />
                    )}
                  </motion.button>

                  {/* Indicateurs de navigation sur mobile */}
                  <div className="flex md:hidden space-x-1.5">
                    {features.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectFeature(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          activeIndex === idx
                            ? "w-5 bg-[#d9840d]"
                            : "bg-[#beac93]/50"
                        }`}
                        aria-label={`Voir fonctionnalité ${idx + 1}`}
                      />
                    ))}
                  </div>
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

        {/* Panneau latéral avec les fonctionnalités - caché sur mobile en mode liste compacte */}
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
