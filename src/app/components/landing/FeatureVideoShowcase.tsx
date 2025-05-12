"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
}

export default function EnhancedFeatureVideoShowcase({
  features,
  backgroundColor = "#19140d",
  accentColor = "#d9840d",
}: VideoShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

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
      activeVideo.currentTime = 0; // Réinitialiser la vidéo au début
      activeVideo.muted = isMuted;

      if (isPlaying) {
        activeVideo.play().catch((e) => {
          console.error("Erreur lors de la lecture de la vidéo:", e);
          setIsPlaying(false);
        });
      } else {
        activeVideo.pause();
      }
    }
  }, [activeIndex, isPlaying, isMuted]);

  // Mettre à jour la progression de la vidéo
  useEffect(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (!activeVideo) return;

    const updateProgress = () => {
      const currentProgress =
        (activeVideo.currentTime / activeVideo.duration) * 100;
      setProgress(currentProgress);
    };

    const handleVideoEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    activeVideo.addEventListener("timeupdate", updateProgress);
    activeVideo.addEventListener("ended", handleVideoEnd);

    return () => {
      activeVideo.removeEventListener("timeupdate", updateProgress);
      activeVideo.removeEventListener("ended", handleVideoEnd);
    };
  }, [activeIndex]);

  // Gérer le mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
    setIsPlaying(false);
    setShowInfo(false);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
    setIsPlaying(false);
    setShowInfo(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const activeVideo = videoRefs.current[activeIndex];
    if (activeVideo) activeVideo.muted = !isMuted;
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Erreur lors de la tentative de passage en plein écran: ${err.message}`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  const selectFeature = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
    setShowInfo(false);
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
      className="w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-[#beac93] shadow-xl bg-white"
    >
      <div className="flex flex-col md:flex-row">
        {/* Section vidéo - version améliorée */}
        <div
          ref={videoContainerRef}
          className={`relative w-full md:w-3/5 overflow-hidden transition-all duration-300 ${
            isFullscreen ? "h-screen" : ""
          }`}
          style={{ backgroundColor }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full relative"
              style={{ aspectRatio: "16/9" }}
            >
              {features.map((feature, idx) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 ${activeIndex === idx ? "block" : "hidden"}`}
                >
                  {/* Image poster en fallback */}
                  {feature.poster && (
                    <Image
                      src={feature.poster}
                      alt={feature.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className={`object-cover transition-opacity duration-300 ${
                        isPlaying ? "opacity-0" : "opacity-100"
                      }`}
                      priority={idx === activeIndex}
                    />
                  )}

                  {/* Vidéo avec preload optimisé */}
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    src={feature.videoSrc}
                    poster={feature.poster}
                    className="w-full h-full object-cover"
                    playsInline
                    loop
                    preload={idx === activeIndex ? "auto" : "none"}
                    onClick={togglePlayPause}
                  />
                </div>
              ))}

              {/* Overlay de contrôle amélioré */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                flex flex-col justify-end p-4 md:p-6 transition-opacity duration-300 
                ${isPlaying && !showInfo ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
              >
                {/* Titre et description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {activeFeature.title}
                  </h3>
                  <p
                    className={`text-sm md:text-base text-white/80 max-w-2xl 
                    ${showInfo ? "" : "line-clamp-2 md:line-clamp-2"}`}
                  >
                    {activeFeature.description}
                  </p>
                </motion.div>

                {/* Barre de progression */}
                <div className="w-full h-1 bg-white/20 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: accentColor,
                    }}
                  ></div>
                </div>

                {/* Contrôles principaux */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Bouton play/pause */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={togglePlayPause}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center 
                      transition-colors hover:bg-white/10 backdrop-blur-sm`}
                      style={{ backgroundColor: `${accentColor}` }}
                      aria-label={isPlaying ? "Pause" : "Lecture"}
                    >
                      {isPlaying ? (
                        <Pause
                          size={isMobile ? 18 : 24}
                          className="text-white"
                        />
                      ) : (
                        <Play
                          size={isMobile ? 18 : 24}
                          className="ml-1 text-white"
                        />
                      )}
                    </motion.button>

                    {/* Bouton muet/son */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20"
                      aria-label={isMuted ? "Activer le son" : "Couper le son"}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </motion.button>

                    {/* Bouton info */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleInfo}
                      className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center
                      ${showInfo ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                      aria-label="Plus d'informations"
                    >
                      <Info size={18} className="text-white" />
                    </motion.button>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Bouton plein écran */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleFullscreen}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20"
                      aria-label="Plein écran"
                    >
                      <Maximize2 size={18} />
                    </motion.button>
                  </div>
                </div>

                {/* Indicateurs de navigation sur mobile */}
                <div className="flex md:hidden justify-center mt-4 space-x-1.5">
                  {features.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectFeature(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeIndex === idx ? "w-5" : "bg-white/30"
                      }`}
                      style={{
                        backgroundColor:
                          activeIndex === idx ? accentColor : undefined,
                      }}
                      aria-label={`Voir fonctionnalité ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Boutons de navigation sur desktop */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4 pointer-events-none hidden md:flex">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors pointer-events-auto shadow-lg"
                  aria-label="Fonctionnalité précédente"
                >
                  <ChevronLeft size={20} className="mx-auto" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors pointer-events-auto shadow-lg"
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

          {/* Version mobile - liste horizontale scrollable */}
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
