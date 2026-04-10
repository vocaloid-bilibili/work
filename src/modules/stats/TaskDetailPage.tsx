// src/modules/stats/TaskDetailPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/ui/cn";
import { useAuth } from "@/shell/AuthProvider";
import { useTaskDetail, useOpsLog, useBackNav } from "./useStats";
import { taskName } from "./statsApi";
import { Section, UserChip } from "./statsAtoms";
import ProgressBlock from "./ProgressBlock";
import Leaderboard from "./Leaderboard";
import Timeline from "./Timeline";

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const nav = useNavigate();
  const { username } = useAuth();
  const detail = useTaskDetail(taskId);
  const opsLog = useOpsLog(taskId ?? null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    void detail.load();
  }, [detail.load]);

  useEffect(() => {
    if (!detail.loading && taskId) {
      void opsLog.load(true);
    }
  }, [detail.loading, taskId]);

  const reload = useCallback(() => {
    opsLog.reset();
    void detail.load();
  }, [detail, opsLog]);

  useBackNav("/stats");

  const s = detail.stats;

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
        ? ((s?.contributors ?? []).find((c) => c.user.id === selectedUser)
            ?.user ?? null)
        : null,
    [s?.contributors, selectedUser],
  );

  if (detail.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 -ml-2 shrink-0"
          onClick={() => nav("/stats")}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {detail.meta ? taskName(detail.meta) : "任务详情"}
          </h1>
          {detail.meta && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {detail.meta.createdAt?.slice(0, 10)}
              {detail.meta.contributorCount != null &&
                ` · ${detail.meta.contributorCount} 位贡献者`}
              {detail.meta.closedAt && " · 已关闭"}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={reload}
          disabled={detail.loading}
        >
          <RefreshCw
            className={cn("h-4 w-4", detail.loading && "animate-spin")}
          />
        </Button>
      </div>

      {s ? (
        <div className="space-y-10">
          <ProgressBlock
            recordCount={s.recordCount}
            included={s.totalIncluded}
            blacklisted={s.totalBlacklisted}
            edits={s.totalFieldEdits}
            totalOps={s.totalOperations}
          />

          <Section title="贡献者排行">
            <Leaderboard
              list={s.contributors}
              currentUsername={username || ""}
              onSelect={(id) => setSelectedUser((p) => (p === id ? null : id))}
              selectedId={selectedUser}
            />
          </Section>

          <Section
            title="操作记录"
            right={
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {selectedUser
                    ? `${filteredOps.length} 条`
                    : `${opsLog.ops.length} / ${opsLog.total}`}
                </span>
                <UserChip
                  user={selectedProfile}
                  onClear={() => setSelectedUser(null)}
                />
              </div>
            }
          >
            <Timeline
              ops={filteredOps}
              total={selectedUser ? filteredOps.length : opsLog.total}
              hasMore={selectedUser ? false : opsLog.hasMore}
              loading={opsLog.loading}
              onLoadMore={() => opsLog.load(false)}
            />
          </Section>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-20">任务不存在</p>
      )}
    </div>
  );
}
