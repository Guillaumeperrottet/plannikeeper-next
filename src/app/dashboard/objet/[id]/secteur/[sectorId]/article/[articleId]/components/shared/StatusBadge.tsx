import { Badge } from "@/app/components/ui/badge";
import { getStatusConfig } from "../../lib/taskHelpers";
import { Clock, CheckCircle2, X, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  className = "",
  showIcon = true,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);

  const getIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />;
      case "cancelled":
        return <X className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <Badge
      variant={config.variant}
      className={`gap-1.5 text-xs h-6 px-2.5 ${className}`}
    >
      {showIcon && getIcon()}
      {config.label}
    </Badge>
  );
}
