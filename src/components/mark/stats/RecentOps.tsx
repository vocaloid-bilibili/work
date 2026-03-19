import { CheckCircle2, Ban, Pencil, Undo2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import type { EnrichedLogEntry } from "./types";

const FIELD_LABELS: Record<string, string> = {
  name: "歌名",
  vocal: "歌手",
  author: "作者",
  synthesizer: "引擎",
  copyright: "版权",
  type: "类别",
};

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

function ActionIcon({ action }: { action: string }) {
  if (action === "toggle_include")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (action === "blacklist")
    return <Ban className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (action === "unblacklist")
    return <Undo2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <Pencil className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
}

function actionText(op: EnrichedLogEntry): string {
  if (op.action === "toggle_include") {
    return op.value !== undefined
      ? op.value
        ? "收录了"
        : "取消收录"
      : "切换了收录";
  }
  if (op.action === "blacklist") return "排除了";
  if (op.action === "unblacklist") return "取消排除";
  return `编辑了 ${FIELD_LABELS[op.field] || op.field}`;
}

export default function RecentOps({ ops }: { ops: EnrichedLogEntry[] }) {
  if (ops.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 text-sm">
        暂无操作记录
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {ops.map((op) => {
        const name =
          op.user.nickname || op.user.username || op.user.id.slice(0, 8);
        return (
          <div
            key={op.opId}
            className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <UserAvatar src={op.user.avatar} name={name} size="sm" />
            <ActionIcon action={op.action} />
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium">{name}</span>{" "}
              <span className="text-muted-foreground">{actionText(op)}</span>{" "}
              {op.action === "set" ? (
                <>
                  <span className="font-medium">
                    → {String(op.value ?? "")}
                  </span>{" "}
                  <span className="text-muted-foreground text-xs">
                    ({op.recordTitle})
                  </span>
                </>
              ) : (
                <span className="font-medium truncate">
                  《{op.recordTitle}》
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
              {fmt(op.at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
