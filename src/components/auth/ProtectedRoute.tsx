// src/components/auth/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: string;
}

const ROLE_LEVEL: Record<string, number> = {
  guest: 0,
  user: 1,
  sponsor: 2,
  editor: 3,
  admin: 4,
  superuser: 5,
};

export function ProtectedRoute({
  children,
  minRole = "editor",
}: ProtectedRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userLevel = ROLE_LEVEL[role] ?? 0;
  const requiredLevel = ROLE_LEVEL[minRole] ?? 0;

  if (userLevel < requiredLevel) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
