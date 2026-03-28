// src/modules/stats/tabs/OpsTab.tsx
import { useMemo } from "react";
import { UserChip } from "../statsAtoms";
import Timeline from "../Timeline";
import type { OpsLogState } from "../useStats";
import type { ContributorStats } from "@/core/types/stats";

interface P {
  opsLog: OpsLogState;
  selectedUser: string | null;
  contributors: ContributorStats[];
  onClearUser: () => void;
}

export default function OpsTab({
  opsLog,
  selectedUser,
  contributors,
  onClearUser,
}: P) {
  const selectedProfile = useMemo(
    () =>
      selectedUser
        ? (contributors.find((c) => c.user.id === selectedUser)?.user ?? null)
        : null,
    [contributors, selectedUser],
  );

  const scopeLabel = opsLog.scope === "global" ? "全局" : "当前任务";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted">
            {scopeLabel}
          </span>
          <span>
            {selectedUser
              ? `${opsLog.ops.length} / 共 ${opsLog.total} 条`
              : `已加载 ${opsLog.ops.length} / 共 ${opsLog.total} 条`}
          </span>
        </div>
        <UserChip user={selectedProfile} onClear={onClearUser} />
      </div>
      <Timeline
        ops={opsLog.ops}
        total={opsLog.total}
        hasMore={opsLog.hasMore}
        loading={opsLog.loading}
        onLoadMore={() => opsLog.load(false)}
      />
    </div>
  );
}
