// src/app/components/ui/LordiconFeature.tsx
"use client";

import { useEffect, useRef } from "react";
import { Player } from "@lordicon/react";
import { motion } from "framer-motion";

type IconType = any;

interface FeatureProps {
  title: string;
  description: string;
  icon: IconType;
  color: string;
  index: number;
}

export default function LordiconFeature({
  title,
  description,
  icon,
  color,
  index,
}: FeatureProps) {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    // Seulement tenter de jouer l'animation si l'icône est définie
    if (icon && playerRef.current) {
      playerRef.current.playFromBeginning();
    }
  }, [icon]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -10 }}
      className="bg-white p-6 rounded-2xl shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div
        className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-5`}
      >
        {icon ? (
          <Player ref={playerRef} icon={icon} size={40} colorize="#ffffff" />
        ) : (
          // Fallback pour quand l'icône n'est pas disponible
          <div className="text-white text-2xl">📊</div>
        )}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}
