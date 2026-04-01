// src/shell/Router.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import AuthGate from "./AuthGate";
import LoginPage from "./LoginPage";
import MarkPage from "@/modules/marking/MarkPage";
import IngestPage from "@/modules/ingest/IngestPage";
import EditorPage from "@/modules/editor/EditorPage";

const StatsPage = lazy(() => import("@/modules/stats/StatsPage"));
const TaskDetailPage = lazy(() => import("@/modules/stats/TaskDetailPage"));

function Fb() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
              <StatsPage />
            </Suspense>
          </AuthGate>
        }
      />
      <Route
        path="/stats/:taskId"
        element={
          <AuthGate>
            <Suspense fallback={<Fb />}>
              <TaskDetailPage />
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
      <Route path="*" element={<Navigate to="/mark" replace />} />
    </Routes>
  );
}
