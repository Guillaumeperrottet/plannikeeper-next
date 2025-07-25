import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        warning:
          "border-transparent bg-[#ffeab0] text-[#8b5a00] hover:bg-[#ffdf91]",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        // Variantes spécifiques pour les tâches
        pending:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200",
        inProgress:
          "border-transparent bg-sky-100 text-sky-800 hover:bg-sky-200",
        completed:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        cancelled:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
