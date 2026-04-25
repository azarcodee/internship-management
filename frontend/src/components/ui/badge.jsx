import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold border transition-colors",
  {
    variants: {
      variant: {
        default:    "bg-[#F8F9FB] text-[#7A8BA0] border-[#E5EBF3]",
        primary:    "bg-[#E7F0FF] text-[#3A86FF] border-blue-200",
        success:    "bg-[#E6FBF3] text-[#22C97A] border-green-200",
        warning:    "bg-[#FFF6E6] text-[#D97706] border-amber-200",
        destructive:"bg-[#FFECEC] text-[#FF5A5A] border-red-200",
        secondary:  "bg-purple-50 text-purple-600 border-purple-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
