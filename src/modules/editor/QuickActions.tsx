// src/modules/editor/QuickActions.tsx
import {
  GitMerge,
  Link2,
  Users,
  Tv,
  Trash2,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import { cn } from "@/ui/cn";

interface Props {
  onAction: (action: string) => void;
}

const ACTIONS = [
  {
    id: "add",
    icon: Plus,
    title: "添加收录",
    desc: "添加新视频收录到已有歌曲或创建新歌曲",
    color: "text-blue-500",
    bg: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
  },
  {
    id: "merge-song",
    icon: GitMerge,
    title: "合并歌曲",
    desc: "将源歌曲的视频和艺人转移到目标",
    color: "text-purple-500",
    bg: "hover:bg-purple-50 dark:hover:bg-purple-950/30",
  },
  {
    id: "merge-artist",
    icon: Users,
    title: "合并艺人",
    desc: "将源艺人的所有歌曲关联转移到目标",
    color: "text-indigo-500",
    bg: "hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
  },
  {
    id: "reassign",
    icon: ArrowRightLeft,
    title: "拆分/移动视频",
    desc: "将视频移到另一首歌曲",
    color: "text-amber-500",
    bg: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  },
  {
    id: "manage-relations",
    icon: Link2,
    title: "管理关联作品",
    desc: "搜索歌曲并编辑本家/衍生关联关系",
    color: "text-emerald-500",
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
  },
  {
    id: "board-video",
    icon: Tv,
    title: "榜单视频",
    desc: "设置榜单期对应的B站投稿视频",
    color: "text-green-500",
    bg: "hover:bg-green-50 dark:hover:bg-green-950/30",
  },
  {
    id: "remove",
    icon: Trash2,
    title: "移除收录",
    desc: "从 collected 数据中移除歌曲或视频",
    color: "text-orange-500",
    bg: "hover:bg-orange-50 dark:hover:bg-orange-950/30",
  },
];

export default function QuickActions({ onAction }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">快捷操作</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
              a.bg,
            )}
          >
            <a.icon className={cn("h-5 w-5 shrink-0 mt-0.5", a.color)} />
            <div>
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {a.desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
