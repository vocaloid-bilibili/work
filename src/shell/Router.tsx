// src/shell/Router.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import LoginPage from "./LoginPage";
import MarkPage from "@/modules/marking/MarkPage";
import IngestPage from "@/modules/ingest/IngestPage";
import EditorPage from "@/modules/editor/EditorPage";

const Dashboard = lazy(() => import("@/modules/stats/Dashboard"));
const TaskDetail = lazy(() => import("@/modules/stats/TaskDetail"));
const HistoryPage = lazy(() => import("@/modules/stats/HistoryPage"));

function Fb() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function NotFoundPage() {
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => nav("/mark", { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">页面不存在，3 秒后自动跳转…</p>
    </div>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mark" element={<MarkPage />} />
      <Route
        path="/stats"
        element={
          <Suspense fallback={<Fb />}>
            <Dashboard />
          </Suspense>
        }
      />
      <Route
        path="/stats/history"
        element={
          <Suspense fallback={<Fb />}>
            <HistoryPage />
          </Suspense>
        }
      />
      <Route
        path="/stats/:taskId"
        element={
          <Suspense fallback={<Fb />}>
            <TaskDetail />
          </Suspense>
        }
      />
      <Route path="/upload" element={<IngestPage />} />
      <Route path="/edit/*" element={<EditorPage />} />
      <Route path="/contributions" element={<Navigate to="/stats" replace />} />
      <Route path="/" element={<Navigate to="/mark" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
