// src/modules/marking/check/CheckDialog.tsx
import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import {
  XCircle,
  AlertTriangle,
  Download,
  CheckCircle2,
  CircleDot,
  FileWarning,
  TextCursorInput,
  UserCheck,
  GitCompareArrows,
  Users,
} from "lucide-react";
import { cn } from "@/ui/cn";
import type { CheckResult } from "./checkTypes";
import { FIELD_LABELS } from "./checkTypes";
import CheckSection from "./CheckSection";
import CheckRow from "./CheckRow";

interface P {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  result: CheckResult;
  onJump: (i: number) => void;
  onExport: () => void;
}

export default function CheckDialog({
  open,
  onOpenChange,
  result,
  onJump,
  onExport,
}: P) {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const add = useCallback(
    (k: string) => setConfirmed((p) => new Set(p).add(k)),
    [],
  );
  const reset = useCallback(() => setConfirmed(new Set()), []);

  const {
    pending,
    missingFields,
    nameMatchTitle,
    authorMatchUp,
    sameAuthorDiffName,
    inconsistentEntries,
  } = result;
  const inconsN = inconsistentEntries.reduce((s, g) => s + g.entries.length, 0);
  const sameN = sameAuthorDiffName.reduce((s, g) => s + g.songs.length, 0);
  const hasMand =
    pending.length > 0 ||
    missingFields.length > 0 ||
    inconsistentEntries.length > 0;
  const hasAdv =
    nameMatchTitle.length > 0 ||
    authorMatchUp.length > 0 ||
    sameAuthorDiffName.length > 0;
  const advOk =
    (nameMatchTitle.length === 0 || confirmed.has("nm")) &&
    (authorMatchUp.length === 0 || confirmed.has("am")) &&
    (sameAuthorDiffName.length === 0 || confirmed.has("sad"));
  const canExport = !hasMand && advOk;
  const allClear = !hasMand && !hasAdv;
  const mandN = pending.length + missingFields.length + inconsN;

  const jump = useCallback(
    (i: number) => {
      onOpenChange(false);
      setTimeout(() => onJump(i), 150);
    },
    [onOpenChange, onJump],
  );

  const segs = useMemo(() => {
    const s: { count: number; color: string; label: string }[] = [];
    if (pending.length)
      s.push({ count: pending.length, color: "bg-red-500", label: "待处理" });
    if (missingFields.length)
      s.push({
        count: missingFields.length,
        color: "bg-red-400",
        label: "字段缺失",
      });
    if (inconsistentEntries.length)
      s.push({ count: inconsN, color: "bg-red-300", label: "不一致" });
    if (nameMatchTitle.length)
      s.push({
        count: nameMatchTitle.length,
        color: confirmed.has("nm") ? "bg-emerald-400" : "bg-amber-400",
        label: "歌名=标题",
      });
    if (authorMatchUp.length)
      s.push({
        count: authorMatchUp.length,
        color: confirmed.has("am") ? "bg-emerald-400" : "bg-amber-400",
        label: "作者=UP",
      });
    if (sameAuthorDiffName.length)
      s.push({
        count: sameN,
        color: confirmed.has("sad") ? "bg-emerald-400" : "bg-amber-300",
        label: "同作者异名",
      });
    return s;
  }, [
    pending,
    missingFields,
    inconsistentEntries,
    inconsN,
    nameMatchTitle,
    authorMatchUp,
    sameAuthorDiffName,
    sameN,
    confirmed,
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent
        className={cn(
          "max-w-lg p-0 flex flex-col gap-0 overflow-hidden h-[90dvh] sm:h-auto sm:max-h-[80vh]",
        )}
      >
        <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 space-y-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            {allClear ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : hasMand ? (
              <FileWarning className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            导出前检查
          </DialogTitle>
          <DialogDescription className="sr-only">
            检查导出数据
          </DialogDescription>
          {!allClear && (
            <div className="space-y-1.5">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                {segs.map((s, i) => (
                  <div
                    key={i}
                    className={cn("transition-all", s.color)}
                    style={{ flex: s.count }}
                  />
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {segs.map((s, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground"
                  >
                    <span
                      className={cn("w-2 h-2 rounded-full shrink-0", s.color)}
                    />
                    {s.label}{" "}
                    <span className="font-medium text-foreground/80">
                      {s.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-5 pb-4">
            {allClear ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="font-semibold">所有检查已通过</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  数据完整，可以导出
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <CheckSection
                  icon={<CircleDot className="h-4 w-4 text-red-500" />}
                  label="待处理"
                  count={pending.length}
                  severity="error"
                  defaultOpen={pending.length > 0 && pending.length <= 15}
                >
                  {pending.map((it) => (
                    <CheckRow
                      key={it.index}
                      index={it.index}
                      title={it.title}
                      onJump={() => jump(it.index)}
                    />
                  ))}
                </CheckSection>
                <CheckSection
                  icon={<XCircle className="h-4 w-4 text-red-500" />}
                  label="字段缺失"
                  count={missingFields.length}
                  severity="error"
                  defaultOpen={missingFields.length <= 15}
                >
                  {missingFields.map((it) => (
                    <CheckRow
                      key={it.index}
                      index={it.index}
                      title={it.title}
                      badges={it.missingLabels.map((l) => ({
                        label: l,
                        cls: "text-red-500 border-red-300 dark:border-red-800",
                      }))}
                      onJump={() => jump(it.index)}
                    />
                  ))}
                </CheckSection>
                <CheckSection
                  icon={<GitCompareArrows className="h-4 w-4 text-red-500" />}
                  label="标注不一致"
                  count={inconsN}
                  severity="error"
                  defaultOpen={inconsN <= 20}
                >
                  {inconsistentEntries.map((g) => (
                    <div key={g.key} className="space-y-0.5">
                      <div className="flex flex-col gap-1 px-2.5 py-1.5 bg-red-50/50 dark:bg-red-950/20 rounded-md mt-1 first:mt-0">
                        <div className="text-xs font-medium truncate">
                          <span className="text-muted-foreground">歌名</span>{" "}
                          {g.name}{" "}
                          <span className="text-muted-foreground ml-1">
                            作者
                          </span>{" "}
                          {g.author}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {g.inconsistentFields.map((f) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className="text-[10px] h-4.5 px-1.5 text-red-500 border-red-300 dark:border-red-800"
                            >
                              {FIELD_LABELS[f] || f} 不一致
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {g.entries.map((it) => (
                        <CheckRow
                          key={it.index}
                          index={it.index}
                          title={it.title}
                          badges={g.inconsistentFields.map((f) => ({
                            label: `${FIELD_LABELS[f]}: ${it.values[f]}`,
                            cls: "text-red-500 border-red-300 dark:border-red-800",
                          }))}
                          onJump={() => jump(it.index)}
                        />
                      ))}
                    </div>
                  ))}
                </CheckSection>
                <CheckSection
                  icon={<TextCursorInput className="h-4 w-4 text-amber-500" />}
                  label="歌名与标题一致"
                  count={nameMatchTitle.length}
                  severity="warn"
                  confirmed={confirmed.has("nm")}
                  onConfirm={() => add("nm")}
                  defaultOpen={nameMatchTitle.length <= 10}
                >
                  {nameMatchTitle.map((it) => (
                    <CheckRow
                      key={it.index}
                      index={it.index}
                      title={it.title}
                      extra="歌名未修改"
                      onJump={() => jump(it.index)}
                    />
                  ))}
                </CheckSection>
                <CheckSection
                  icon={<UserCheck className="h-4 w-4 text-amber-500" />}
                  label="作者与UP主一致"
                  count={authorMatchUp.length}
                  severity="warn"
                  confirmed={confirmed.has("am")}
                  onConfirm={() => add("am")}
                  defaultOpen={authorMatchUp.length <= 10}
                >
                  {authorMatchUp.map((it) => (
                    <CheckRow
                      key={it.index}
                      index={it.index}
                      title={it.title}
                      extra={it.detail}
                      onJump={() => jump(it.index)}
                    />
                  ))}
                </CheckSection>
                <CheckSection
                  icon={<Users className="h-4 w-4 text-amber-500" />}
                  label="同作者不同歌名"
                  count={sameN}
                  severity="warn"
                  confirmed={confirmed.has("sad")}
                  onConfirm={() => add("sad")}
                  defaultOpen={sameN <= 15}
                >
                  {sameAuthorDiffName.map((g) => (
                    <div key={g.author} className="space-y-0.5">
                      <div className="px-2.5 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-md mt-1 first:mt-0">
                        <div className="text-xs font-medium">
                          <span className="text-muted-foreground">作者</span>{" "}
                          {g.author}{" "}
                          <span className="text-muted-foreground ml-2">
                            {g.songs.length} 首
                          </span>
                        </div>
                      </div>
                      {g.songs.map((s) => (
                        <CheckRow
                          key={s.index}
                          index={s.index}
                          title={s.title}
                          extra={`歌名: ${s.name}`}
                          onJump={() => jump(s.index)}
                        />
                      ))}
                    </div>
                  ))}
                </CheckSection>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="px-4 sm:px-5 py-3 border-t bg-muted/20 shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              {hasMand ? (
                <span className="text-red-500 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  {mandN} 项阻止导出
                </span>
              ) : hasAdv && !advOk ? (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  请确认提醒项
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  可以导出
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                size="sm"
                disabled={!canExport}
                className="gap-1.5"
                onClick={() => {
                  onOpenChange(false);
                  onExport();
                }}
              >
                <Download className="h-3.5 w-3.5" />
                导出
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
