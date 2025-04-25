"use client";

import { useRef, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

// Types pour les propriétés
interface CarouselImage {
  src: string;
  alt: string;
}

interface DualDirectionCarouselProps {
  topImages: CarouselImage[];
  bottomImages: CarouselImage[];
  speed?: number; // Vitesse de défilement en pixels par seconde
}

const DualDirectionCarousel = ({
  topImages,
  bottomImages,
  speed = 40,
}: DualDirectionCarouselProps) => {
  const topControlsRef = useAnimationControls();
  const bottomControlsRef = useAnimationControls();

  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  // Dupliquer les images pour créer un effet de défilement continu
  const duplicatedTopImages = [...topImages, ...topImages];
  const duplicatedBottomImages = [...bottomImages, ...bottomImages];

  useEffect(() => {
    // Fonction pour animer les carrousels
    const animateCarousel = async () => {
      if (!topRowRef.current || !bottomRowRef.current) return;

      // Calculer la largeur totale de la première série d'images
      const topRowWidth = topRowRef.current.scrollWidth / 2;
      const bottomRowWidth = bottomRowRef.current.scrollWidth / 2;

      // Durée basée sur la vitesse
      const topDuration = topRowWidth / speed;
      const bottomDuration = bottomRowWidth / speed;

      // Animer la rangée du haut (droite vers gauche)
      topControlsRef.start({
        x: -topRowWidth,
        transition: {
          duration: topDuration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      });

      // Animer la rangée du bas (gauche vers droite)
      bottomControlsRef.start({
        x: bottomRowWidth,
        transition: {
          duration: bottomDuration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        },
      });
    };

    // Démarrer l'animation après un court délai pour s'assurer que tout est rendu
    const timeout = setTimeout(animateCarousel, 100);
    return () => clearTimeout(timeout);
  }, [topImages, bottomImages, speed, topControlsRef, bottomControlsRef]);

  return (
    <div className="w-full overflow-hidden">
      {/* Rangée du haut - défilement de droite à gauche */}
      <div className="relative py-4 overflow-hidden">
        <motion.div
          ref={topRowRef}
          className="flex"
          animate={topControlsRef}
          initial={{ x: 0 }}
        >
          {duplicatedTopImages.map((image, index) => (
            <div
              key={`top-${index}`}
              className="flex-shrink-0 mx-2 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105"
              style={{ width: "300px", height: "200px" }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                style={{
                  borderRadius: "12px",
                  border: "2px solid #000",
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Rangée du bas - défilement de gauche à droite */}
      <div className="relative py-4 overflow-hidden">
        <motion.div
          ref={bottomRowRef}
          className="flex"
          animate={bottomControlsRef}
          initial={{ x: -bottomRowRef.current?.scrollWidth / 2 || 0 }}
        >
          {duplicatedBottomImages.map((image, index) => (
            <div
              key={`bottom-${index}`}
              className="flex-shrink-0 mx-2 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105"
              style={{ width: "300px", height: "200px" }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                style={{
                  borderRadius: "12px",
                  border: "2px solid #000",
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DualDirectionCarousel;
