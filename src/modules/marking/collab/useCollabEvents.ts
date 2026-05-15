// src/modules/marking/collab/useCollabEvents.ts
import { useCallback } from "react";
import type { Snapshot, MarkOp } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";
import type { WsEvent } from "@/core/ws/RealtimeSocket";

interface EventDeps {
  snap: {
    versionRef: React.RefObject<number>;
    taskIdRef: React.RefObject<string | null>;
    bumpVersion: (v: number) => void;
    apply: (s: Snapshot) => void;
  };
  opsRef: React.RefObject<{
    handleCommitted: (op: MarkOp, version: number) => void;
    handleConflict: (data: {
      opId: string;
      currentVersion?: number;
      recordIndex?: number;
      field?: string;
      currentValue?: unknown;
    }) => void;
    clearPending: () => void;
  }>;
  wsRef: React.RefObject<{ send: (data: Record<string, unknown>) => void }>;
  refreshRef: React.RefObject<() => Promise<void>>;
  setVersion: React.Dispatch<React.SetStateAction<number>>;
  setAttributions: React.Dispatch<React.SetStateAction<Attribution[]>>;
  setConflict: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useCollabEvents(deps: EventDeps) {
  const {
    snap,
    opsRef,
    wsRef,
    refreshRef,
    setVersion,
    setAttributions,
    setConflict,
  } = deps;

  return useCallback(
    (event: WsEvent) => {
      switch (event.type) {
        case "connected":
          break;

        case "task_joined": {
          const v =
            typeof event.version === "number"
              ? event.version
              : snap.versionRef.current;
          snap.bumpVersion(v);
          setVersion((p) => Math.max(p, v));
          break;
        }

        case "operation_committed": {
          const op = event.operation as MarkOp | undefined;
          if (!op) break;
          opsRef.current.handleCommitted(
            op,
            typeof event.version === "number"
              ? event.version
              : snap.versionRef.current,
          );
          if (
            op.action === "toggle_include" ||
            op.action === "blacklist" ||
            op.action === "unblacklist"
          ) {
            const profile = (
              event as WsEvent & {
                userProfile?: Attribution["actionByProfile"];
              }
            ).userProfile;
            setAttributions((prev) => {
              const next = [...prev];
              if (
                op.action === "unblacklist" ||
                (op.action === "toggle_include" && !op.value)
              ) {
                next[op.recordIndex] = {};
              } else if (op.action === "toggle_include" && op.value) {
                next[op.recordIndex] = {
                  actionByProfile: profile,
                  action: "include",
                  actionAt: new Date().toISOString(),
                };
              } else if (op.action === "blacklist") {
                next[op.recordIndex] = {
                  actionByProfile: profile,
                  action: "blacklist",
                  actionAt: new Date().toISOString(),
                };
              }
              return next;
            });
          }
          break;
        }

        case "operation_conflicted": {
          opsRef.current.handleConflict({
            opId: typeof event.opId === "string" ? event.opId : "",
            currentVersion: event.currentVersion as number | undefined,
            recordIndex: event.recordIndex as number | undefined,
            field: event.field as string | undefined,
            currentValue: event.currentValue,
          });
          setConflict(
            typeof event.message === "string" ? event.message : "冲突",
          );
          void refreshRef.current();
          break;
        }

        case "snapshot_reloaded": {
          const s = event.snapshot as Snapshot | undefined;
          if (s) {
            snap.apply(s);
            opsRef.current.clearPending();
            setConflict(null);
          }
          break;
        }

        case "error": {
          const msg = typeof event.message === "string" ? event.message : "";
          if (msg.includes("join_task") && snap.taskIdRef.current) {
            wsRef.current.send({
              type: "join_task",
              taskId: snap.taskIdRef.current,
            });
          }
          break;
        }
      }
    },
    [snap, opsRef, wsRef, refreshRef, setVersion, setAttributions, setConflict],
  );
}
