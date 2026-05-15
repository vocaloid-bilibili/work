// src/modules/editor/layout/TopBar.tsx
import {
  ArrowLeft,
  Search,
  Circle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSync } from "../hooks/useSync";
import { VIEW_LABEL } from "../types";

function SyncDot() {
  const { st } = useSync();
  if (!st)
    return (
      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/30" />
    );
  if (st.health && !st.health.ok)
    return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
  if (st.pending === 0)
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  return (
    <span className="relative flex items-center gap-1 text-[11px] font-semibold text-amber-600">
      <Circle className="h-2 w-2 fill-amber-500 text-amber-500 animate-pulse" />
      {st.pending}
    </span>
  );
}

export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/edit" || location.pathname === "/";

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/edit" || path === "/") return VIEW_LABEL.home;
    const match = path.match(/^\/edit\/(song|video|add|merge-song|merge-artist|reassign|board|sync)/);
    if (match) {
      return VIEW_LABEL[match[1]] ?? "编辑工作台";
    }
    return "编辑工作台";
  };

  return (
    <header className="w-full flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-2 min-w-0">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight truncate">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenSearch}
          className="rounded-lg p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="搜索"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate("/edit/sync")}
          className="rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
          title="同步状态"
        >
          <SyncDot />
        </button>
      </div>
    </header>
  );
}
