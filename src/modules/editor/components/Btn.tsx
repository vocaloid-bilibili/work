// src/modules/editor/components/Btn.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/ui/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none shrink-0";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
  secondary:
    "border border-border/60 bg-card hover:bg-muted/60 active:bg-muted",
  ghost:
    "hover:bg-muted/60 active:bg-muted text-muted-foreground hover:text-foreground",
  danger:
    "border border-destructive/30 text-destructive hover:bg-destructive/10 active:bg-destructive/20",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-9 px-4 text-sm rounded-lg",
};

export function Btn({
  variant = "secondary",
  size = "md",
  loading,
  icon,
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}
