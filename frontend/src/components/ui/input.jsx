import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-[#e0ddd8] bg-[#faf9f7] px-4 py-2.5 text-[15px] text-[#1a1a1a] placeholder:text-[#999] focus:outline-none focus:border-[#a0a09a] transition-all font-dm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("block text-xs font-semibold mb-1.5 text-[#666] uppercase tracking-wider font-dm", className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, Label };
