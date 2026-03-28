// src/shell/AuthGate.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (role === "guest") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
