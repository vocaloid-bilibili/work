// mark/export-check/ExportCheckDialog.tsx

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/contexts/BookmarksContext";
import type { ExportCheckResult } from "../exportCheck";
import { FIELD_LABELS } from "../exportCheck";
import CheckSection from "./CheckSection";
import ItemRow from "./ItemRow";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  checkResult: ExportCheckResult;
  onJump: (index: number) => void;
  onExport: () => void;
}

export default function ExportCheckDialog({
  open,
  onOpenChange,
  checkResult,
  onJump,
  onExport,
}: Props) {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const resetConfirmed = useCallback(() => setConfirmed(new Set()), []);

  const addConfirm = useCallback((key: string) => {
    setConfirmed((prev) => new Set(prev).add(key));
  }, []);

  const {
    pending,
    missingFields,
    nameMatchTitle,
    authorMatchUp,
    sameAuthorDiffName,
    inconsistentEntries,
  } = checkResult;

  // 新增的计数
  const inconsistentCount = inconsistentEntries.reduce(
    (s, g) => s + g.entries.length,
    0,
  );
  const sameAuthorCount = sameAuthorDiffName.reduce(
    (s, g) => s + g.songs.length,
    0,
  );

  const hasMandatory =
    pending.length > 0 ||
    missingFields.length > 0 ||
    inconsistentEntries.length > 0; // ★ 新增

  const hasAdvisory =
    nameMatchTitle.length > 0 ||
    authorMatchUp.length > 0 ||
    sameAuthorDiffName.length > 0; // ★ 新增

  const advisoryConfirmed =
    (nameMatchTitle.length === 0 || confirmed.has("nameMatch")) &&
    (authorMatchUp.length === 0 || confirmed.has("authorMatch")) &&
    (sameAuthorDiffName.length === 0 || confirmed.has("sameAuthorDiffName")); // ★ 新增

  const canExport = !hasMandatory && advisoryConfirmed;
  const allClear = !hasMandatory && !hasAdvisory;

  // ── helpers ──

  const jump = useCallback(
    (index: number) => {
      onOpenChange(false);
      setTimeout(() => onJump(index), 150);
    },
    [onOpenChange, onJump],
  );

  const bookmarkAll = useCallback(
    (items: { index: number; title: string }[]) => {
      for (const item of items) {
        if (!isBookmarked(item.index)) {
          toggleBookmark(item.index, item.title);
        }
      }
    },
    [isBookmarked, toggleBookmark],
  );

  // ── summary bar ──

  const summarySegments = useMemo(() => {
    const segs: { count: number; color: string; label: string }[] = [];
    if (pending.length > 0)
      segs.push({
        count: pending.length,
        color: "bg-red-500",
        label: "待处理",
      });
    if (missingFields.length > 0)
      segs.push({
        count: missingFields.length,
        color: "bg-red-400",
        label: "字段缺失",
      });
    if (inconsistentEntries.length > 0)
      segs.push({
        count: inconsistentCount,
        color: "bg-red-300",
        label: "字段不一致",
      });
    if (nameMatchTitle.length > 0)
      segs.push({
        count: nameMatchTitle.length,
        color: confirmed.has("nameMatch") ? "bg-emerald-400" : "bg-amber-400",
        label: "歌名=标题",
      });
    if (authorMatchUp.length > 0)
      segs.push({
        count: authorMatchUp.length,
        color: confirmed.has("authorMatch") ? "bg-emerald-400" : "bg-amber-400",
        label: "作者=UP",
      });
    if (sameAuthorDiffName.length > 0)
      segs.push({
        count: sameAuthorCount,
        color: confirmed.has("sameAuthorDiffName")
          ? "bg-emerald-400"
          : "bg-amber-300",
        label: "同作者异名",
      });
    return segs;
  }, [
    pending,
    missingFields,
    inconsistentEntries,
    inconsistentCount,
    nameMatchTitle,
    authorMatchUp,
    sameAuthorDiffName,
    sameAuthorCount,
    confirmed,
  ]);

  // mandatory 总数（用于 footer）
  const mandatoryCount =
    pending.length + missingFields.length + inconsistentCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetConfirmed();
      }}
    >
      <DialogContent className="max-w-lg max-h-[80vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-3 space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            {allClear ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : hasMandatory ? (
              <FileWarning className="h-5 w-5 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            导出前检查
          </DialogTitle>
          <DialogDescription className="sr-only">
            检查导出数据中的问题
          </DialogDescription>

          {!allClear && (
            <div className="space-y-1.5">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                {summarySegments.map((seg, i) => (
                  <div
                    key={i}
                    className={cn("transition-all", seg.color)}
                    style={{ flex: seg.count }}
                  />
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {summarySegments.map((seg, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground"
                  >
                    <span className={cn("w-2 h-2 rounded-full", seg.color)} />
                    {seg.label}
                    <span className="font-medium text-foreground/80">
                      {seg.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* ── Body ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 pb-4">
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
                {/* ── 待处理 ── */}
                <CheckSection
                  icon={<CircleDot className="h-4 w-4 text-red-500" />}
                  label="待处理（未收录也未排除）"
                  count={pending.length}
                  severity="error"
                  defaultOpen={pending.length > 0 && pending.length <= 15}
                  onBookmarkAll={
                    pending.length > 3 ? () => bookmarkAll(pending) : undefined
                  }
                >
                  {pending.map((item) => (
                    <ItemRow
                      key={item.index}
                      index={item.index}
                      title={item.title}
                      onJump={() => jump(item.index)}
                      onBookmark={() => toggleBookmark(item.index, item.title)}
                    />
                  ))}
                </CheckSection>

                {/* ── 字段缺失 ── */}
                <CheckSection
                  icon={<XCircle className="h-4 w-4 text-red-500" />}
                  label="字段缺失（已收录但信息不完整）"
                  count={missingFields.length}
                  severity="error"
                  defaultOpen={
                    missingFields.length > 0 && missingFields.length <= 15
                  }
                  onBookmarkAll={
                    missingFields.length > 3
                      ? () =>
                          bookmarkAll(
                            missingFields.map((m) => ({
                              index: m.index,
                              title: `[缺] ${m.missingLabels.join("、")} — ${m.title}`,
                            })),
                          )
                      : undefined
                  }
                >
                  {missingFields.map((item) => (
                    <ItemRow
                      key={item.index}
                      index={item.index}
                      title={item.title}
                      badges={item.missingLabels.map((l) => ({
                        label: l,
                        className:
                          "text-red-500 border-red-300 dark:border-red-800",
                      }))}
                      onJump={() => jump(item.index)}
                      onBookmark={() =>
                        toggleBookmark(
                          item.index,
                          `[缺] ${item.missingLabels.join("、")} — ${item.title}`,
                        )
                      }
                    />
                  ))}
                </CheckSection>

                {/* ★ 新增：字段不一致（error） */}
                <CheckSection
                  icon={<GitCompareArrows className="h-4 w-4 text-red-500" />}
                  label="同歌名同作者但标注不一致"
                  count={inconsistentCount}
                  severity="error"
                  defaultOpen={
                    inconsistentEntries.length > 0 && inconsistentCount <= 20
                  }
                  onBookmarkAll={
                    inconsistentCount > 3
                      ? () =>
                          bookmarkAll(
                            inconsistentEntries.flatMap((g) =>
                              g.entries.map((e) => ({
                                index: e.index,
                                title: `[不一致] ${g.inconsistentFields.map((f) => FIELD_LABELS[f]).join("、")} — ${e.title}`,
                              })),
                            ),
                          )
                      : undefined
                  }
                >
                  {inconsistentEntries.map((group) => (
                    <div key={group.key} className="space-y-0.5">
                      {/* 分组头 */}
                      <div className="flex flex-col gap-1 px-2.5 py-1.5 bg-red-50/50 dark:bg-red-950/20 rounded-md mt-1 first:mt-0">
                        <div className="text-xs font-medium truncate">
                          <span className="text-muted-foreground">歌名</span>{" "}
                          {group.name}{" "}
                          <span className="text-muted-foreground ml-1">
                            作者
                          </span>{" "}
                          {group.author}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {group.inconsistentFields.map((f) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className="text-[10px] h-[18px] px-1.5 text-red-500 border-red-300 dark:border-red-800"
                            >
                              {FIELD_LABELS[f] || f} 不一致
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {/* 组内条目 */}
                      {group.entries.map((item) => (
                        <ItemRow
                          key={item.index}
                          index={item.index}
                          title={item.title}
                          badges={group.inconsistentFields.map((f) => ({
                            label: `${FIELD_LABELS[f]}: ${item.values[f]}`,
                            className:
                              "text-red-500 border-red-300 dark:border-red-800",
                          }))}
                          onJump={() => jump(item.index)}
                          onBookmark={() =>
                            toggleBookmark(
                              item.index,
                              `[不一致] ${group.inconsistentFields.map((f) => FIELD_LABELS[f]).join("、")} — ${item.title}`,
                            )
                          }
                        />
                      ))}
                    </div>
                  ))}
                </CheckSection>

                {/* ── 歌名=标题 ── */}
                <CheckSection
                  icon={<TextCursorInput className="h-4 w-4 text-amber-500" />}
                  label="歌名与视频标题一致"
                  count={nameMatchTitle.length}
                  severity="warn"
                  confirmed={confirmed.has("nameMatch")}
                  onConfirm={() => addConfirm("nameMatch")}
                  defaultOpen={
                    nameMatchTitle.length > 0 && nameMatchTitle.length <= 10
                  }
                >
                  {nameMatchTitle.map((item) => (
                    <ItemRow
                      key={item.index}
                      index={item.index}
                      title={item.title}
                      extra="歌名未修改，与标题相同"
                      onJump={() => jump(item.index)}
                    />
                  ))}
                </CheckSection>

                {/* ── 作者=UP ── */}
                <CheckSection
                  icon={<UserCheck className="h-4 w-4 text-amber-500" />}
                  label="作者与UP主一致"
                  count={authorMatchUp.length}
                  severity="warn"
                  confirmed={confirmed.has("authorMatch")}
                  onConfirm={() => addConfirm("authorMatch")}
                  defaultOpen={
                    authorMatchUp.length > 0 && authorMatchUp.length <= 10
                  }
                >
                  {authorMatchUp.map((item) => (
                    <ItemRow
                      key={item.index}
                      index={item.index}
                      title={item.title}
                      extra={item.detail}
                      onJump={() => jump(item.index)}
                    />
                  ))}
                </CheckSection>

                {/* ★ 新增：同作者不同歌名（caution） */}
                <CheckSection
                  icon={<Users className="h-4 w-4 text-amber-500" />}
                  label="同作者不同歌名（可能是同曲异名）"
                  count={sameAuthorCount}
                  severity="warn"
                  confirmed={confirmed.has("sameAuthorDiffName")}
                  onConfirm={() => addConfirm("sameAuthorDiffName")}
                  defaultOpen={
                    sameAuthorDiffName.length > 0 && sameAuthorCount <= 15
                  }
                >
                  {sameAuthorDiffName.map((group) => (
                    <div key={group.author} className="space-y-0.5">
                      {/* 分组头 */}
                      <div className="px-2.5 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-md mt-1 first:mt-0">
                        <div className="text-xs font-medium">
                          <span className="text-muted-foreground">作者</span>{" "}
                          {group.author}
                          <span className="text-muted-foreground ml-2">
                            {group.songs.length} 首不同歌名
                          </span>
                        </div>
                      </div>
                      {/* 组内条目 */}
                      {group.songs.map((item) => (
                        <ItemRow
                          key={item.index}
                          index={item.index}
                          title={item.title}
                          extra={`歌名: ${item.name}`}
                          onJump={() => jump(item.index)}
                          onBookmark={() =>
                            toggleBookmark(item.index, item.title)
                          }
                        />
                      ))}
                    </div>
                  ))}
                </CheckSection>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <DialogFooter className="px-5 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              {hasMandatory ? (
                <span className="text-red-500 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  {mandatoryCount} 项阻止导出
                </span>
              ) : hasAdvisory && !advisoryConfirmed ? (
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
