// src/modules/editor/components/Section.tsx
import { cn } from "@/ui/cn";

interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  noPad?: boolean;
}

export function Section({ title, children, className, actions, noPad }: Props) {
  return (
    <section
      className={cn("rounded-2xl border bg-card overflow-hidden", className)}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3 border-b">
          {title && (
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              {title}
            </h3>
          )}
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      )}
      <div className={cn(noPad ? "" : "p-5")}>{children}</div>
    </section>
  );
}
