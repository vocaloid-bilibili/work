// src/modules/editor/components/Field.tsx
import { cn } from "@/ui/cn";

interface Props {
  label: string;
  hint?: string;
  error?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-semibold text-foreground/70">
        {label}
      </label>
      {children}
      {hint && (
        <p
          className={cn(
            "text-[11px]",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
