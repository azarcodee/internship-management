import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 flex items-start gap-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-[#E7F0FF] border-blue-200 text-[#1A5FBF]",
        warning: "bg-[#FFF6E6] border-amber-200 text-[#92400E]",
        destructive: "bg-[#FFECEC] border-red-200 text-[#991B1B]",
        success: "bg-[#E6FBF3] border-green-200 text-[#065F46]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("font-bold leading-none tracking-tight mb-1 font-sora", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
