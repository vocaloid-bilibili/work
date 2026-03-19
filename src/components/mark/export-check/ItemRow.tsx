import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ItemRowProps {
  index: number;
  title: string;
  extra?: React.ReactNode;
  badges?: { label: string; className?: string }[];
  onJump: () => void;
}

export default function ItemRow({
  index,
  title,
  extra,
  badges,
  onJump,
}: ItemRowProps) {
  return (
    <div className="group flex items-start gap-2.5 py-1.5 px-2.5 rounded-md hover:bg-muted/60 transition-colors overflow-hidden">
      <span className="text-muted-foreground/70 text-[11px] font-mono w-7 shrink-0 text-right pt-0.5 tabular-nums">
        {index + 1}
      </span>

      <div className="flex-1 w-0 min-w-0 space-y-0.5">
        <p className="text-[13px] leading-snug truncate" title={title}>
          {title}
        </p>
        {badges && badges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {badges.map((b) => (
              <Badge
                key={b.label}
                variant="outline"
                className={`text-xs h-5 px-2 font-normal shrink-0 ${b.className ?? ""}`}
              >
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {extra && (
          <p
            className="text-[11px] text-muted-foreground leading-tight truncate"
            title={typeof extra === "string" ? extra : undefined}
          >
            {extra}
          </p>
        )}
      </div>

      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onJump}
          title="跳转到此条"
        >
          <MapPin className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
