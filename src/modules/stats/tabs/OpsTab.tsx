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
  const filteredOps = useMemo(
    () =>
      selectedUser
        ? opsLog.ops.filter((o) => o.user?.id === selectedUser)
        : opsLog.ops,
    [opsLog.ops, selectedUser],
  );

  const selectedProfile = useMemo(
    () =>
      selectedUser
        ? (contributors.find((c) => c.user.id === selectedUser)?.user ?? null)
        : null,
    [contributors, selectedUser],
  );

  const displayTotal = selectedUser ? filteredOps.length : opsLog.total;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {selectedUser
            ? `已筛选 ${filteredOps.length} 条`
            : `已加载 ${opsLog.ops.length} / 共 ${opsLog.total} 条`}
        </p>
        <UserChip user={selectedProfile} onClear={onClearUser} />
      </div>
      <Timeline
        ops={filteredOps}
        total={displayTotal}
        hasMore={selectedUser ? false : opsLog.hasMore}
        loading={opsLog.loading}
        onLoadMore={() => opsLog.load(false)}
      />
    </div>
  );
}
