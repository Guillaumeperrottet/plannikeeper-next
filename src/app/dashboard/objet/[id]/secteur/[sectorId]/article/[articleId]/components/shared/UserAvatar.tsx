import { User } from "lucide-react";
import { User as UserType } from "../../lib/types";

interface UserAvatarProps {
  user: UserType | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  size = "md",
  showName = false,
  className = "",
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (!user) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}
      >
        <User size={iconSizes[size]} />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-red-500",
  ];

  const colorIndex =
    user.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-medium`}
      >
        {initials}
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700">{user.name}</span>
      )}
    </div>
  );
}
