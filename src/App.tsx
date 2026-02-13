import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Home from '@/views/Home';
import Mark from '@/views/Mark';
import Upload from '@/views/Upload';
import Edit from '@/views/Edit';

const navs = [
  {
    name: '首页',
    path: '/'
  },
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

function Header() {
  const location = useLocation();

  return (
    <header className="h-10 w-full grid grid-cols-4 items-stretch justify-stretch border-b bg-background">
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

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="w-full flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mark" element={<Mark />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/edit" element={<Edit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer>
          {/* Footer content if any */}
        </footer>
      </div>
    </Router>
  );
}

export default App;
