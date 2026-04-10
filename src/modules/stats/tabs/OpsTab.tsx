// src/modules/stats/tabs/OpsTab.tsx
import { useMemo, useEffect } from "react";
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
  // 首次进入时自动加载
  useEffect(() => {
    if (opsLog.ops.length === 0 && !opsLog.loading && opsLog.total === 0) {
      void opsLog.load(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProfile = useMemo(
    () =>
      selectedUser
        ? (contributors.find((c) => c.user.id === selectedUser)?.user ?? null)
        : null,
    [contributors, selectedUser],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {selectedUser
            ? `${opsLog.ops.length} / 共 ${opsLog.total} 条`
            : `已加载 ${opsLog.ops.length} / 共 ${opsLog.total} 条`}
        </span>
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
