// src/modules/editor/components/Section.tsx
import { cn } from "@/ui/cn";

interface Props {
  title?: string;
  children: React.ReactNode;
  noPad?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function Section({ title, children, noPad, actions, className }: Props) {
  return (
    <div className={cn("rounded-2xl border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-0">
          <h3 className="text-sm font-bold">{title}</h3>
          {actions}
        </div>
      )}
      <div className={noPad ? "" : "p-4 sm:p-5 pt-3 sm:pt-3.5"}>{children}</div>
    </div>
  );
}
