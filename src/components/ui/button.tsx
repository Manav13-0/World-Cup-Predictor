import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-violet-500 to-secondary text-primary-foreground shadow-[0_18px_50px_rgba(124,58,237,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(124,58,237,0.34)]",
        secondary: "bg-white/10 text-foreground backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/[0.15]",
        ghost: "hover:bg-white/10 hover:text-foreground",
        outline: "border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white/10",
        destructive:
          "bg-gradient-to-r from-rose-500 to-red-600 text-destructive-foreground shadow-[0_18px_50px_rgba(239,68,68,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(239,68,68,0.34)]"
      },
      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4",
        lg: "h-11 px-6",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
