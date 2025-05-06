"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const activeFeature = features[activeIndex];

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

  return (
    <div className="w-full max-w-7xl mx-auto bg-[#f5f3ef] rounded-3xl overflow-hidden border border-[#beac93] shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Panneau latéral avec les fonctionnalités */}
        <div className="lg:col-span-2 bg-[#f2e8d9] p-6 lg:p-8 flex flex-col">
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-[#141313]">
            Découvrez nos fonctionnalités
          </h3>

          <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
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

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#141313] hover:bg-[#d9840d] hover:text-white transition-colors"
              aria-label="Fonctionnalité précédente"
            >
              <ChevronLeft size={20} />
            </button>

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

            <button
              onClick={handleNext}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#141313] hover:bg-[#d9840d] hover:text-white transition-colors"
              aria-label="Fonctionnalité suivante"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Section vidéo */}
        <div className="lg:col-span-3 bg-[#19140d] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative aspect-video"
            >
              {features.map((feature, idx) => (
                <div
                  key={feature.id}
                  className={`absolute inset-0 ${activeIndex === idx ? "block" : "hidden"}`}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    src={feature.videoSrc}
                    poster={feature.poster}
                    className="w-full h-full object-cover"
                    playsInline
                    loop
                    muted
                  />
                </div>
              ))}

              {/* Superposition avec titre et contrôles */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {activeFeature.title}
                </h3>
                <p className="text-white/80 mb-4 max-w-2xl">
                  {activeFeature.description}
                </p>

                <div className="flex items-center">
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-[#d9840d] text-white flex items-center justify-center hover:bg-[#c6780c] transition-colors"
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                  >
                    {isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} className="ml-1" />
                    )}
                  </button>

                  <div className="ml-4 text-white/60 text-sm">
                    {isPlaying
                      ? "Cliquez pour mettre en pause"
                      : "Cliquez pour voir en action"}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
