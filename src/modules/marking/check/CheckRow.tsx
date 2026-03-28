// src/modules/marking/check/CheckRow.tsx
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { MapPin } from "lucide-react";

interface P {
  index: number;
  title: string;
  extra?: React.ReactNode;
  badges?: { label: string; cls?: string }[];
  onJump: () => void;
}

export default function CheckRow({ index, title, extra, badges, onJump }: P) {
  return (
    <div className="group flex items-start gap-2 sm:gap-2.5 py-1.5 px-2 sm:px-2.5 rounded-md hover:bg-muted/60 active:bg-muted/80 transition-colors overflow-hidden">
      <span className="text-muted-foreground/70 text-[11px] font-mono w-6 sm:w-7 shrink-0 text-right pt-0.5 tabular-nums">
        {index + 1}
      </span>
      <div className="flex-1 w-0 min-w-0 space-y-0.5">
        <p className="text-[13px] leading-snug truncate" title={title}>
          {title}
        </p>
        {badges && badges.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {badges.map((b) => (
              <Badge
                key={b.label}
                variant="outline"
                className={`text-[10px] sm:text-xs h-4.5 sm:h-5 px-1.5 sm:px-2 font-normal shrink-0 ${b.cls ?? ""}`}
              >
                {b.label}
              </Badge>
            ))}
          </div>
        )}
        {extra && (
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            {extra}
          </p>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0 pt-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onJump}
          title="跳转"
        >
          <MapPin className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
