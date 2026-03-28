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

export default function GlobalTab({
  global,
  currentUsername,
  selectedUser,
  onSelectUser,
}: P) {
  if (!global) {
    return <p className="text-center text-muted-foreground py-20">暂无数据</p>;
  }

  return (
    <div className="space-y-10">
      <GlobalCards
        tasks={global.taskCount}
        contributors={global.contributors.length}
        ops={global.contributors.reduce((s, c) => s + c.totalOps, 0)}
        score={Math.round(global.contributors.reduce((s, c) => s + c.score, 0))}
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

      <div className="rounded-xl bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground/70">积分计算</span>
        <span className="ml-3 tabular-nums">
          收录 ×{" "}
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {global.weights.include}
          </span>
          {" + "}排除 ×{" "}
          <span className="font-bold text-red-500 dark:text-red-400">
            {global.weights.blacklist}
          </span>
          {" + "}编辑 ×{" "}
          <span className="font-bold text-blue-500 dark:text-blue-400">
            {global.weights.fieldEdit}
          </span>
        </span>
      </div>
    </div>
  );
}
