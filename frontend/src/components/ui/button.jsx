import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer font-dm",
  {
    variants: {
      variant: {
        default: "bg-[#1a1a1a] text-white hover:bg-[#333] shadow-sm",
        destructive: "bg-red-50 text-[#c0392b] border border-red-200 hover:bg-red-100",
        outline: "border border-[#e0ddd8] bg-white text-[#1a1a1a] hover:bg-[#faf9f7]",
        secondary: "bg-[#faf9f7] text-[#1a1a1a] border border-[#e0ddd8] hover:bg-[#f0ede8]",
        ghost: "text-[#666] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
        link: "text-[#1a1a1a] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
