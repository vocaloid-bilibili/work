// src/modules/editor/components/Input.tsx
import { forwardRef } from "react";
import { cn } from "@/ui/cn";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-sm",
      "outline-none transition-all duration-150",
      "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
      "placeholder:text-muted-foreground/40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
