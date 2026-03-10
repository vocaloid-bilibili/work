// src/components/layout/Header.tsx

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";

const navs = [
  { name: "上传", path: "/" },
  { name: "打标", path: "/mark" },
  { name: "编辑", path: "/edit" },
];

export default function Header() {
  const location = useLocation();
  const { role, logout } = useAuth();
  const isLoggedIn = role !== "guest";

  return (
    <header className="h-10 w-full flex items-stretch border-b bg-background">
      {isLoggedIn ? (
        navs.map((nav) => (
          <Link
            key={nav.path}
            to={nav.path}
            className={cn(
              "flex-1 flex items-center justify-center hover:bg-muted/50 transition-colors",
              location.pathname === nav.path ? "bg-muted font-medium" : "",
            )}
          >
            <span className="text-sm">{nav.name}</span>
          </Link>
        ))
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          管理后台
        </div>
      )}

      {isLoggedIn ? (
        <div className="flex items-stretch">
          <div className="flex items-center gap-1.5 px-3 text-xs text-muted-foreground border-l">
            <User className="h-3 w-3" />
            <span>{role}</span>
          </div>
          <button
            onClick={logout}
            className="w-10 flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground border-l"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="w-16 flex items-center justify-center hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
        >
          登录
        </Link>
      )}
    </header>
  );
}
