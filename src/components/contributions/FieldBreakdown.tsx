// src/components/contributions/FieldBreakdown.tsx

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FIELD_LABELS, FIELD_BADGE_STYLES } from "./constants";

export default function FieldBreakdown({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const entries = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return null;

  return (
    <>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold mb-2">字段修改分布</h3>
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([f, c]) => (
            <Badge
              key={f}
              variant="outline"
              className={`text-xs ${FIELD_BADGE_STYLES[f] || ""}`}
            >
              {FIELD_LABELS[f] || f}
              <span className="ml-1 font-bold tabular-nums">{c}</span>
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
