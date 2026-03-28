// src/modules/marking/card/MarkCard.tsx
import { memo } from "react";
import { Card, CardContent } from "@/ui/card";
import { cn } from "@/ui/cn";
import CardCover from "./CardCover";
import CardActions from "./CardActions";
import CardFields from "./CardFields";
import Avatar from "@/shared/ui/Avatar";
import type { Attribution } from "@/core/types/stats";

interface P {
  record: any;
  include: boolean;
  blacklisted: boolean;
  index: number;
  attribution?: Attribution;
  onIncludeChange: (v: boolean) => void;
  onBlacklist: () => void;
  onUnblacklist: () => void;
  onUpdate: (record: any) => void;
}

function MarkCardInner({
  record,
  include,
  blacklisted,
  index,
  attribution,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
  onUpdate,
}: P) {
  const handleChange = (field: string, value: any) =>
    onUpdate((prev: any) => ({ ...prev, [field]: value }));
  const handleInputChange = (field: string, value: string) => {
    const key = `_unconfirmed_${field}`;
    onUpdate((prev: any) =>
      prev[key] === value ? prev : { ...prev, [key]: value },
    );
  };

  const border = blacklisted
    ? "border-red-400/60 bg-red-50/40 dark:bg-red-950/20"
    : include
      ? "border-emerald-400/40 bg-emerald-50/20 dark:bg-emerald-950/10"
      : record.status === "auto"
        ? "border-yellow-300/40 bg-yellow-50/30 dark:bg-yellow-950/15"
        : record.status === "done"
          ? "border-sky-300/40 bg-sky-50/30 dark:bg-sky-950/15"
          : "";

  const profile = attribution?.actionByProfile;
  const actionLabel =
    attribution?.action === "include"
      ? "收录"
      : attribution?.action === "exclude" || attribution?.action === "blacklist"
        ? "排除"
        : null;

  return (
    <Card
      id={`record-${index}`}
      className={cn(
        "w-full transition-all duration-300 hover:shadow-md scroll-mt-24 relative overflow-hidden",
        border,
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 transition-colors",
          blacklisted
            ? "bg-red-500"
            : include
              ? "bg-emerald-500"
              : "bg-muted-foreground/20",
        )}
      />
      <CardContent className="p-4 pl-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">
            <CardCover record={record} blacklisted={blacklisted} />
            <CardActions
              record={record}
              include={include}
              blacklisted={blacklisted}
              onIncludeChange={onIncludeChange}
              onBlacklist={onBlacklist}
              onUnblacklist={onUnblacklist}
            />
            {profile && actionLabel && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                <Avatar
                  src={profile.avatar}
                  name={profile.nickname || profile.username || "?"}
                  size="sm"
                />
                <span className="truncate">
                  {profile.nickname || profile.username || "未知"} {actionLabel}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex-1 flex flex-col gap-3 min-w-0 transition-opacity",
              blacklisted && "opacity-50",
            )}
          >
            <div
              className="font-bold text-lg leading-tight line-clamp-1 pr-12 select-text"
              title={record.title}
            >
              {record.title}
            </div>
            <CardFields
              record={record}
              include={include}
              blacklisted={blacklisted}
              onChange={handleChange}
              onInputChange={handleInputChange}
            />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-auto pt-2 border-t border-dashed select-text">
              <span>时长: {record.duration}</span>
              <span>分P: {record.page}</span>
              {record.tid && <span>分区: {record.tid}</span>}
              {record.bvid && <span className="font-mono">{record.bvid}</span>}
            </div>
            {record.intro && (
              <div className="bg-muted/40 p-2.5 rounded-lg text-xs text-muted-foreground max-h-14 overflow-y-auto leading-relaxed select-text">
                {record.intro}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(MarkCardInner);
