// src/modules/stats/tabs/CurrentTab.tsx
import type { TaskStats } from "@/core/types/stats";
import { Section } from "../statsAtoms";
import ProgressBlock from "../ProgressBlock";
import Leaderboard from "../Leaderboard";

interface P {
  task: TaskStats | null;
  currentUsername: string;
  selectedUser: string | null;
  onSelectUser: (id: string) => void;
}

export default function CurrentTab({
  task,
  currentUsername,
  selectedUser,
  onSelectUser,
}: P) {
  if (!task) {
    return (
      <p className="text-center text-muted-foreground py-20">暂无活跃任务</p>
    );
  }

  return (
    <div className="space-y-10">
      <ProgressBlock
        recordCount={task.recordCount}
        included={task.totalIncluded}
        blacklisted={task.totalBlacklisted}
        edits={task.totalFieldEdits}
        totalOps={task.totalOperations}
      />
      <Section title="贡献者排行">
        <Leaderboard
          list={task.contributors}
          currentUsername={currentUsername}
          onSelect={onSelectUser}
          selectedId={selectedUser}
        />
      </Section>
    </div>
  );
}
