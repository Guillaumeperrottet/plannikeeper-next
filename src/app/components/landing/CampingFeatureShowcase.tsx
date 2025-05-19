import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

interface FeatureProps {
  title: string;
  description: string;
  videoSrc: string;
  poster?: string;
  alignRight?: boolean;
}

const SimpleVideoFeature: React.FC<FeatureProps> = ({
  title,
  description,
  videoSrc,
  poster,
  alignRight = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((e) => {
          console.error("Erreur lors de la lecture de la vidéo:", e);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Réinitialiser l'état de lecture lorsque la vidéo se termine
  useEffect(() => {
    const videoElement = videoRef.current;
    const handleEnded = () => setIsPlaying(false);

    if (videoElement) {
      videoElement.addEventListener("ended", handleEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("ended", handleEnded);
      }
    };
  }, []);

  return (
    <div
      className={`flex flex-col ${
        alignRight ? "md:flex-row-reverse" : "md:flex-row"
      } items-center gap-8 my-16`}
    >
      {/* Partie texte */}
      <motion.div
        className="w-full md:w-1/2 p-6"
        initial={{ opacity: 0, x: alignRight ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#141313]">
          {title}
        </h3>
        <p className="text-[#62605d] text-lg">{description}</p>
      </motion.div>

      {/* Partie vidéo */}
      <motion.div
        className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-xl border-4 border-white"
        initial={{ opacity: 0, x: alignRight ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Overlay pour effet visuel */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

        {/* Vidéo */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          className="w-full h-full object-cover aspect-video"
          playsInline
          muted
          loop
        />

        {/* Bouton play/pause */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className="absolute bottom-6 left-6 z-20 w-12 h-12 rounded-full bg-[#d9840d]/90 text-white flex items-center justify-center hover:bg-[#d9840d] transition-colors shadow-lg backdrop-blur-sm"
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-1" />
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

// Composant principal qui assemble les 3 sections de fonctionnalités
const CampingFeatureShowcase = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Première fonctionnalité - Texte à gauche, vidéo à droite */}
      <SimpleVideoFeature
        title="Visualisation interactive du camping"
        description="Permet de naviguer virtuellement dans votre camping. Visualisez tous vos emplacements, animations et équipements en quelques clics."
        videoSrc="/videos/feature-camping-map.mp4"
        poster="/images/features/camping-map-poster.jpg"
      />

      {/* Seconde fonctionnalité - Texte à droite, vidéo à gauche */}
      <SimpleVideoFeature
        title="Gestion des tâches simplifiée"
        description="Centralisez toutes vos tâches et notifications dans un seul endroit. Assurez-vous que rien n'est oublié."
        videoSrc="/videos/feature-task.mp4"
        poster="/images/features/feature-task.jpg"
        alignRight={true}
      />

      {/* Troisième fonctionnalité - Texte à gauche, vidéo à droite */}
      <SimpleVideoFeature
        title="Communication facilitée"
        description="ASsignez des tâches à vos équipes, soyez notifié, garder un historique, et imprimer vos tâches pour les distribuer à vos équipes."
        videoSrc="/videos/feature-communication.mp4"
        poster="/images/features/communication-poster.jpg"
      />
    </div>
  );
};

export default CampingFeatureShowcase;
