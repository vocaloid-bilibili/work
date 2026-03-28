// src/shell/Router.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import AuthGate from "./AuthGate";
import LoginPage from "./LoginPage";
import MarkPage from "@/modules/marking/MarkPage";
import IngestPage from "@/modules/ingest/IngestPage";
import CatalogPage from "@/modules/catalog/CatalogPage";
import StatsPage from "@/modules/stats/StatsPage";

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
            <CatalogPage />
          </AuthGate>
        }
      />
      <Route
        path="/contributions"
        element={
          <AuthGate>
            <StatsPage />
          </AuthGate>
        }
      />
      <Route path="/" element={<Navigate to="/mark" replace />} />
      <Route path="*" element={<Navigate to="/mark" replace />} />
    </Routes>
  );
}
