// src/app/components/ui/LordiconFeatureWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Import dynamique avec désactivation du SSR
const LordiconFeature = dynamic(() => import("./LordiconFeature"), {
  ssr: false,
});

// Composant temporaire de chargement
function LoadingFeature({
  title,
  description,
  color,
  index,
}: {
  title: string;
  description: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
    >
      <div
        className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-5`}
      >
        {/* Placeholder pour l'icône */}
        <div className="w-10 h-10 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

export default function LordiconFeatureWrapper(props: any) {
  return <LordiconFeature {...props} />;
}
