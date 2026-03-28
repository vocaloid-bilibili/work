// src/shell/Header.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { cn } from "@/ui/cn";
import { LogIn, LogOut, User, ChevronDown, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { useCachedSrc } from "@/shared/ui/CachedImg";

const NAV = [
  { name: "打标", path: "/mark" },
  { name: "上传", path: "/upload" },
  { name: "编辑", path: "/edit" },
  { name: "贡献", path: "/contributions" },
];

export default function Header() {
  const loc = useLocation();
  const nav = useNavigate();
  const { role, nickname, username, avatarUrl, logout } = useAuth();
  const logged = role !== "guest";
  const avatar = useCachedSrc(avatarUrl ?? undefined);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {logged && (
            <nav className="hidden sm:flex items-center gap-0.5">
              <a
                href="https://vocabili.top"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                主站
                <ExternalLink className="h-3 w-3" />
              </a>
              {NAV.map((n) => (
                <Link
                  key={n.path}
                  to={n.path}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-sm font-medium transition",
                    loc.pathname === n.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n.name}
                  {loc.pathname === n.path && (
                    <span className="absolute inset-x-1 -bottom-2.25 h-0.5 rounded-full bg-foreground" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center">
          {logged ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border bg-background px-1.5 py-1 pr-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="max-w-24 truncate font-medium">
                    {nickname ?? username ?? "用户"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {nickname ?? "未设置昵称"}
                      </p>
                      {username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{username}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {role}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="sm:hidden">
                  <DropdownMenuItem asChild>
                    <a
                      href="https://vocabili.top"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between"
                    >
                      主站
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </DropdownMenuItem>
                  {NAV.map((n) => (
                    <DropdownMenuItem
                      key={n.path}
                      onClick={() => nav(n.path)}
                      className={cn(
                        loc.pathname === n.path && "bg-accent font-medium",
                      )}
                    >
                      {n.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    nav("/login", { replace: true });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
