// src/shell/Router.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import AuthGate from "./AuthGate";
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
      <Route
        path="/mark"
        element={
          <AuthGate>
            <MarkPage />
          </AuthGate>
        }
      />
      <Route
        path="/stats"
        element={
          <AuthGate>
            <Suspense fallback={<Fb />}>
              <Dashboard />
            </Suspense>
          </AuthGate>
        }
      />
      <Route
        path="/stats/history"
        element={
          <AuthGate>
            <Suspense fallback={<Fb />}>
              <HistoryPage />
            </Suspense>
          </AuthGate>
        }
      />
      <Route
        path="/stats/:taskId"
        element={
          <AuthGate>
            <Suspense fallback={<Fb />}>
              <TaskDetail />
            </Suspense>
          </AuthGate>
        }
      />
      <Route
        path="/upload"
        element={
          <AuthGate>
            <IngestPage />
          </AuthGate>
        }
      />
      <Route
        path="/edit"
        element={
          <AuthGate>
            <EditorPage />
          </AuthGate>
        }
      />
      <Route path="/contributions" element={<Navigate to="/stats" replace />} />
      <Route path="/" element={<Navigate to="/mark" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
