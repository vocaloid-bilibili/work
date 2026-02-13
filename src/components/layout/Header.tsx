import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navs = [
  {
    name: '打标',
    path: '/mark'
  },
  {
    name: '上传',
    path: '/upload'
  },
  {
    name: '编辑',
    path: '/edit'
  }
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="h-10 w-full grid grid-cols-3 items-stretch justify-stretch border-b bg-background">
      {navs.map((nav) => (
        <Link
          key={nav.path}
          to={nav.path}
          className={cn(
            "flex items-center justify-center hover:bg-muted/50 transition-colors",
            location.pathname === nav.path ? "bg-muted font-medium" : ""
          )}
        >
          <div className="text-sm">{nav.name}</div>
        </Link>
      ))}
    </header>
  );
}
