// src/modules/stats/FilterBar.tsx
import { X } from "lucide-react";
import { cn } from "@/ui/cn";
import Avatar from "@/shared/ui/Avatar";
import { ACTIONS, MARK_ACTIONS, EDIT_ACTIONS, type ActionDef } from "./actions";
import type { Filter } from "./hooks";
import type { UserProfile } from "@/core/types/stats";

interface P {
  filter: Filter;
  onFilter: (f: Filter) => void;
  user: UserProfile | null;
  onClearUser: () => void;
}

function activeCat(f: Filter): "all" | "mark" | "edit" {
  if (f === "all" || f === "mark" || f === "edit") return f as any;
  return ACTIONS[f]?.category ?? "all";
}

export default function FilterBar({ filter, onFilter, user, onClearUser }: P) {
  const cat = activeCat(filter);
  const subActions =
    cat === "mark" ? MARK_ACTIONS : cat === "edit" ? EDIT_ACTIONS : [];
  const showSub = cat !== "all";
  const isSpecificAction =
    filter !== "all" && filter !== "mark" && filter !== "edit";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Pill active={filter === "all"} onClick={() => onFilter("all")}>
          全部
        </Pill>
        <Pill
          active={cat === "mark"}
          dot="bg-emerald-500"
          onClick={() => {
            if (isSpecificAction && cat === "mark") onFilter("mark");
            else if (filter === "mark") onFilter("all");
            else onFilter("mark");
          }}
        >
          标注
        </Pill>
        <Pill
          active={cat === "edit"}
          dot="bg-violet-500"
          onClick={() => {
            if (isSpecificAction && cat === "edit") onFilter("edit");
            else if (filter === "edit") onFilter("all");
            else onFilter("edit");
          }}
        >
          编辑
        </Pill>

        <div className="flex-1" />
        {user && (
          <button
            onClick={onClearUser}
            className="inline-flex items-center gap-1.5 h-7 pl-0.5 pr-2.5 rounded-full border bg-muted/60 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Avatar
              src={user.avatar}
              name={user.nickname || user.username || "?"}
              size="sm"
            />
            <span className="max-w-24 truncate">
              {user.nickname || user.username}
            </span>
            <X className="h-3 w-3 opacity-40" />
          </button>
        )}
      </div>

      {showSub && (
        <div className="flex gap-1.5 flex-wrap">
          {subActions.map((a) => (
            <ActionPill
              key={a.key}
              def={a}
              active={filter === a.key}
              onClick={() => onFilter(filter === a.key ? cat : a.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  dot,
  onClick,
  children,
}: {
  active: boolean;
  dot?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all",
        "min-h-9",
        active
          ? "bg-foreground text-background shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            active ? "bg-background/50" : dot,
          )}
        />
      )}
      {children}
    </button>
  );
}

function ActionPill({
  def,
  active,
  onClick,
}: {
  def: ActionDef;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = def.Icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        "min-h-8",
        active
          ? cn(def.bg, def.color, "ring-1 ring-current/15 shadow-sm")
          : "bg-muted/30 text-muted-foreground/70 hover:bg-muted/60 hover:text-foreground/80",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {def.label}
    </button>
  );
}
