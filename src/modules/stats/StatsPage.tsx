// src/modules/stats/StatsPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/ui/cn";
import { useAuth } from "@/shell/AuthProvider";
import { useOverview, useOpsLog, useBackNav } from "./useStats";
import type { OpsScope } from "./useStats";
import { TabBar } from "./statsAtoms";
import TaskList from "./TaskList";
import CurrentTab from "./tabs/CurrentTab";
import OpsTab from "./tabs/OpsTab";
import GlobalTab from "./tabs/GlobalTab";

type Tab = "current" | "ops" | "global" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "current", label: "当前任务" },
  { key: "ops", label: "操作记录" },
  { key: "global", label: "全局统计" },
  { key: "history", label: "历史任务" },
];

export default function StatsPage() {
  const nav = useNavigate();
  const { username } = useAuth();
  const [tab, setTab] = useState<Tab>("current");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const prevTab = useRef<Tab>("current");

  const ov = useOverview();
  const opsLog = useOpsLog(ov.activeId);

  useEffect(() => {
    void ov.load();
  }, [ov.load]);

  const switchTab = useCallback(
    (t: Tab) => {
      setTab(t);
      if (t !== "ops") {
        setSelectedUser(null);
      }
      if (t === "ops") {
        opsLog.init("task", null);
      }
    },
    [opsLog],
  );

  const selectUser = useCallback(
    (id: string) => {
      const cleared = selectedUser === id;
      const newUser = cleared ? null : id;
      setSelectedUser(newUser);

      if (tab === "ops") {
        opsLog.setFilterUser(newUser);
      } else if (newUser) {
        prevTab.current = tab;
        const scope: OpsScope = tab === "global" ? "global" : "task";
        setTab("ops");
        opsLog.init(scope, newUser);
      }
    },
    [tab, opsLog, selectedUser],
  );

  const clearUser = useCallback(() => {
    setSelectedUser(null);
    opsLog.setFilterUser(null);
  }, [opsLog]);

  const refresh = useCallback(() => {
    opsLog.reset();
    void ov.load(true);
  }, [ov, opsLog]);

  useBackNav("/mark", () => {
    if (tab === "ops" && prevTab.current !== "ops") {
      setTab(prevTab.current);
      setSelectedUser(null);
      return true;
    }
    return false;
  });

  if (ov.loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const contributors =
    (opsLog.scope === "global" || tab === "global"
      ? ov.global?.contributors
      : ov.task?.contributors) ??
    ov.global?.contributors ??
    [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 pb-24 space-y-8">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <TabBar tabs={TABS} active={tab} onChange={switchTab} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={refresh}
          disabled={ov.refreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", ov.refreshing && "animate-spin")}
          />
        </Button>
      </div>

      {tab === "current" && (
        <CurrentTab
          task={ov.task}
          currentUsername={username || ""}
          selectedUser={selectedUser}
          onSelectUser={selectUser}
        />
      )}

      {tab === "ops" && (
        <OpsTab
          opsLog={opsLog}
          selectedUser={selectedUser}
          contributors={contributors}
          onClearUser={clearUser}
        />
      )}

      {tab === "global" && (
        <GlobalTab
          global={ov.global}
          currentUsername={username || ""}
          selectedUser={selectedUser}
          onSelectUser={selectUser}
        />
      )}

      {tab === "history" && (
        <TaskList
          tasks={ov.tasks}
          activeId={ov.activeId}
          onSelect={(id) => nav(`/stats/${id}`)}
        />
      )}
    </div>
  );
}
