// src/modules/marking/card/CardActions.tsx
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/tooltip";
import { CheckCircle2, Ban, Undo2 } from "lucide-react";
import { cn } from "@/ui/cn";

interface P {
  record: any;
  include: boolean;
  blacklisted: boolean;
  onIncludeChange: (v: boolean) => void;
  onBlacklist: () => void;
  onUnblacklist: () => void;
}

export default function CardActions({
  record,
  include,
  blacklisted,
  onIncludeChange,
  onBlacklist,
  onUnblacklist,
}: P) {
  const canBl = !blacklisted && !include;
  return (
    <>
      <div className="flex gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={include && !blacklisted ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 transition-all",
                  include && !blacklisted
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "",
                )}
                disabled={blacklisted}
                onClick={() => onIncludeChange(!include)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {include && !blacklisted ? "已收录" : "收录"}
              </Button>
            </TooltipTrigger>
            {blacklisted && (
              <TooltipContent>
                <p>请先取消排除才能收录</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={blacklisted ? "destructive" : "outline"}
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 transition-all",
                  !blacklisted &&
                    canBl &&
                    "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950",
                  !blacklisted && !canBl && "opacity-50 cursor-not-allowed",
                )}
                disabled={!blacklisted && !canBl}
                onClick={blacklisted ? onUnblacklist : onBlacklist}
              >
                {blacklisted ? (
                  <>
                    <Undo2 className="h-4 w-4" />
                    取消排除
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    排除
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {blacklisted ? (
                <p>从排除名单中移除</p>
              ) : !canBl ? (
                <p>请先取消收录再排除</p>
              ) : (
                <p>加入排除名单</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {record.status === "auto" && (
          <Badge
            variant="outline"
            className="text-[10px] bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300"
          >
            AI打标
          </Badge>
        )}
        {record.status === "done" && (
          <Badge
            variant="outline"
            className="text-[10px] bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300"
          >
            已完成
          </Badge>
        )}
      </div>
    </>
  );
}
