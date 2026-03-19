import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
  include: "收录开关",
  blacklist: "排除/取消排除",
};

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
            <Badge key={f} variant="outline" className="text-xs">
              {LABELS[f] || f}
              <span className="ml-1 font-bold">{c}</span>
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
