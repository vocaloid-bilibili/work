// src/components/layout/Header.tsx

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navs = [
  { name: "上传", path: "/" },
  { name: "打标", path: "/mark" },
  { name: "编辑", path: "/edit" },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, nickname, username, avatarUrl, logout } = useAuth();
  const isLoggedIn = role !== "guest";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {isLoggedIn && (
            <nav className="hidden items-center gap-0.5 sm:flex">
              {navs.map((nav) => (
                <Link
                  key={nav.path}
                  to={nav.path}
                  className={cn(
                    "relative rounded-md px-3 py-1.5 text-sm font-medium transition",
                    location.pathname === nav.path
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {nav.name}
                  {location.pathname === nav.path && (
                    <span className="absolute inset-x-1 -bottom-2.25 h-0.5 rounded-full bg-foreground" />
                  )}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* 右侧：用户 */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border bg-background px-1.5 py-1 pr-3 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
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
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
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

                {/* 移动端导航 */}
                <div className="sm:hidden">
                  {navs.map((nav) => (
                    <DropdownMenuItem
                      key={nav.path}
                      onClick={() => navigate(nav.path)}
                      className={cn(
                        location.pathname === nav.path &&
                          "bg-accent font-medium",
                      )}
                    >
                      {nav.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem
                  onClick={handleLogout}
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
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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
