// src/components/contributions/UserAvatar.tsx

import { cn } from "@/lib/utils";
import CachedImg from "@/components/ui/cached-img";

export default function UserAvatar({
  src,
  name,
  size = "md",
  ring = false,
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md";
  ring?: boolean;
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0",
        dim,
        ring && "ring-2 ring-background",
      )}
    >
      {src ? (
        <CachedImg
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-semibold text-muted-foreground select-none">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}
