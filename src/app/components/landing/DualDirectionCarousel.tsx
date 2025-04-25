"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";

type CarouselImage = {
  src: string;
  alt: string;
};

interface TiltedCarouselProps {
  images: CarouselImage[];
  speed?: number; // Vitesse de défilement en pixels par seconde
  tiltAngle?: number; // Angle d'inclinaison en degrés
  scale?: number; // Facteur d'échelle
  gap?: number; // Espace entre les images en pixels
  imageWidth?: number; // Largeur des images en pixels
  imageHeight?: number; // Hauteur des images en pixels
  className?: string;
  borderWidth?: number; // Épaisseur de la bordure en pixels
  pauseOnHover?: boolean; // Pause au survol
}

const TiltedCarousel = ({
  images,
  speed = 40,
  tiltAngle = -10,
  scale = 1.25,
  gap = 16,
  imageWidth = 320,
  imageHeight = 200,
  className = "",
  borderWidth = 4,
  pauseOnHover = true,
}: TiltedCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Effet d'animation pour le déplacement continu
  useEffect(() => {
    // Fonction d'animation qui sera appelée à chaque frame
    const animate = (timestamp: number) => {
      if (!carouselRef.current) return;

      // Initialiser lastTime si c'est le premier frame
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Si l'animation est en pause (survol), on ne déplace pas
      if (isPaused && pauseOnHover) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculer le delta de temps en secondes
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Calculer le nouveau déplacement
      offsetRef.current -= speed * deltaTime;

      // La largeur totale d'un ensemble d'images (50% du contenu)
      const slideWidth = carouselRef.current.scrollWidth / 2;

      // Si le déplacement dépasse la moitié (premier set d'images), réinitialiser
      if (Math.abs(offsetRef.current) >= slideWidth) {
        offsetRef.current += slideWidth;
      }

      // Appliquer la transformation
      carouselRef.current.style.transform = `translateX(${offsetRef.current}px) translateZ(0)`;

      // Continuer l'animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Démarrer l'animation
    animationRef.current = requestAnimationFrame(animate);

    // Nettoyer l'animation lors du démontage
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isPaused, pauseOnHover]);

  // Duplicate images pour créer un effet de boucle infinie
  const duplicatedImages = [...images, ...images];

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Wrapper avec transformation de tilt et scale */}
      <div
        className="w-full h-full py-12"
        style={{
          transform: `scale(${scale}) rotate(${tiltAngle}deg)`,
          transformOrigin: "center center",
        }}
      >
        {/* Conteneur du carousel avec déplacement horizontal */}
        <div
          ref={carouselRef}
          className="relative w-max flex items-center"
          style={{ willChange: "transform" }}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="flex-shrink-0 transition-transform duration-500 hover:scale-105"
              style={{ margin: `0 ${gap / 2}px` }}
            >
              <div
                className="relative overflow-hidden rounded-lg shadow-xl"
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  border: `${borderWidth}px solid black`,
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes={`${imageWidth}px`}
                  priority={index < 4} // Priorité pour les premières images
                  loading={index < 4 ? "eager" : "lazy"}
                  quality={80}
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TiltedCarousel;
