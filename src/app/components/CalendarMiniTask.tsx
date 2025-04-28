import React from "react";
import { motion } from "framer-motion";

type Props = {
  task: {
    id: string;
    name: string;
    color: string | null;
    status: string;
  };
  onClick: (e: React.MouseEvent) => void;
};

const CalendarMiniTask: React.FC<Props> = ({ task, onClick }) => {
  // Couleur de fond selon le statut
  const getBackgroundColor = () => {
    const alpha = "15"; // Transparence en hexadécimal (10%)

    switch (task.status) {
      case "pending":
        return "#FFEDD5"; // warning-background avec moins d'opacité
      case "in_progress":
        return "#E0F2FE"; // info-background avec moins d'opacité
      case "completed":
        return "#DCFCE7"; // success-background avec moins d'opacité
      case "cancelled":
        return "#FEE2E2"; // destructive-background avec moins d'opacité
      default:
        return "var(--muted)";
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        backgroundColor: "var(--accent)",
      }}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="text-xs truncate mb-0.5 px-1 py-0.5 rounded cursor-pointer"
      style={{
        borderLeft: `2px solid ${task.color || "var(--primary)"}`,
        backgroundColor: getBackgroundColor(),
      }}
    >
      {task.name}
    </motion.div>
  );
};

export default CalendarMiniTask;
