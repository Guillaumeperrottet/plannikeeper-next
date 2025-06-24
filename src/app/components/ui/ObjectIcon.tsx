import React from "react";
import {
  Building,
  Tent,
  Car,
  Home,
  MapPin,
  Utensils,
  Bed,
  Waves,
  TreePine,
  Store,
  Warehouse,
  School,
  Hospital,
} from "lucide-react";

interface ObjectIconProps {
  iconKey: string;
  size?: number;
  className?: string;
}

// Map des icônes disponibles
const ICON_MAP = {
  building: Building,
  tent: Tent,
  bed: Bed,
  home: Home,
  utensils: Utensils,
  store: Store,
  warehouse: Warehouse,
  car: Car,
  waves: Waves,
  "tree-pine": TreePine,
  "map-pin": MapPin,
  school: School,
  hospital: Hospital,
} as const;

export default function ObjectIcon({
  iconKey,
  size = 24,
  className = "",
}: ObjectIconProps) {
  const IconComponent = ICON_MAP[iconKey as keyof typeof ICON_MAP] || Building;

  return <IconComponent size={size} className={className} />;
}

export { ICON_MAP };
