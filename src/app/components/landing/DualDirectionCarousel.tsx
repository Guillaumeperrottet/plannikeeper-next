"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";

type CarouselImage = {
  src: string;
  alt: string;
};

interface TiltedCarouselProps {
  images: CarouselImage[];
  speed?: number;
  tiltAngle?: number;
  scale?: number;
  gap?: number;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
  borderWidth?: number;
  pauseOnHover?: boolean;
  direction?: "left" | "right"; // Nouvelle propriété pour la direction
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
  direction = "left", // Par défaut, déplacement vers la gauche
}: TiltedCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const offsetRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Dans le useEffect d'animation
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!carouselRef.current) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (isPaused && pauseOnHover) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Valeur totale que le carousel doit parcourir avant de se réinitialiser
      const totalWidth = carouselRef.current.scrollWidth / 2;

      // Mettre à jour la position en fonction de la direction
      if (direction === "left") {
        // Déplacement vers la gauche (valeurs négatives)
        offsetRef.current -= speed * deltaTime;

        // Réinitialiser lorsque nous avons dépassé la limite
        if (offsetRef.current <= -totalWidth) {
          offsetRef.current = 0;
        }
      } else {
        // Déplacement vers la droite (valeurs positives)
        offsetRef.current += speed * deltaTime;

        // Réinitialiser lorsque nous avons dépassé la limite
        if (offsetRef.current >= totalWidth) {
          offsetRef.current = 0;
        }
      }

      carouselRef.current.style.transform = `translateX(${offsetRef.current}px) translateZ(0)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isPaused, pauseOnHover, direction]);

  // Duplicate images pour créer un effet de boucle infinie
  const duplicatedImages = [...images, ...images];

  return (
    <div
      className={`w-full overflow-visible ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        padding: `${scale * 60}px 0`,
      }}
    >
      {/* Wrapper avec transformation de tilt et scale */}
      <div
        className="w-full h-full"
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
                  priority={index < 4}
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
