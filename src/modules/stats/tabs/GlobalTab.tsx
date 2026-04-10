// src/modules/stats/tabs/GlobalTab.tsx
import type { GlobalStats } from "@/core/types/stats";
import { Section } from "../statsAtoms";
import GlobalCards from "../GlobalCards";
import Leaderboard from "../Leaderboard";

interface P {
  global: GlobalStats | null;
  currentUsername: string;
  selectedUser: string | null;
  onSelectUser: (id: string) => void;
}

const ACTION_LABELS: Record<string, string> = {
  mark_include: "收录",
  mark_exclude: "排除",
  mark_field_edit: "标注编辑",
  edit_song: "编辑歌曲",
  delete_song: "删除歌曲",
  merge_song: "合并歌曲",
  edit_video: "编辑视频",
  delete_video: "删除视频",
  reassign_video: "移动视频",
  merge_artist: "合并艺人",
  set_board_video: "设置榜单",
  add_relation: "添加关联",
  remove_relation: "移除关联",
  add_video: "添加视频",
  add_song: "创建歌曲",
};

export default function GlobalTab({
  global,
  currentUsername,
  selectedUser,
  onSelectUser,
}: P) {
  if (!global)
    return <p className="text-center text-muted-foreground py-20">暂无数据</p>;

  const totalOps = global.contributors.reduce((s, c) => s + c.totalOps, 0);
  const totalScore = Math.round(
    global.contributors.reduce((s, c) => s + c.score, 0),
  );

  return (
    <div className="space-y-10">
      <GlobalCards
        tasks={global.taskCount}
        contributors={global.contributors.length}
        ops={totalOps}
        score={totalScore}
      />

      <Section title="全局贡献排行">
        <Leaderboard
          list={global.contributors}
          currentUsername={currentUsername}
          showTasks
          onSelect={onSelectUser}
          selectedId={selectedUser}
        />
      </Section>

      {global.actionScores && (
        <div className="rounded-xl bg-muted/30 px-5 py-4 space-y-2">
          <span className="text-sm font-semibold text-foreground/70">
            积分规则
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
            {Object.entries(global.actionScores)
              .filter(([, s]) => s > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([action, score]) => (
                <span key={action} className="text-xs">
                  <span className="text-muted-foreground">
                    {ACTION_LABELS[action] || action}
                  </span>{" "}
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    +{score}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
