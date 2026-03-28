// src/shared/ui/StatusDot.tsx
import { Badge } from "@/ui/badge";
import { CheckCircle2, Ban, CircleDot } from "lucide-react";

type S = "included" | "blacklisted" | "pending";
const CFG: Record<
  S,
  { Icon: typeof CheckCircle2; label: string; cls: string }
> = {
  included: {
    Icon: CheckCircle2,
    label: "收录",
    cls: "border-emerald-300 text-emerald-600",
  },
  blacklisted: { Icon: Ban, label: "排除", cls: "border-red-300 text-red-500" },
  pending: {
    Icon: CircleDot,
    label: "待处理",
    cls: "border-amber-300/60 text-muted-foreground",
  },
};

export default function StatusDot({ status }: { status: S }) {
  const c = CFG[status];
  if (!c) return null;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] h-4.5 px-1.5 gap-0.5 ${c.cls}`}
    >
      <c.Icon className="h-2.5 w-2.5" />
      {c.label}
    </Badge>
  );
}
