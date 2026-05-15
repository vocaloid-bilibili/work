// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./shell/App";
import { AuthProvider } from "./shell/AuthProvider";
import { TooltipProvider } from "./ui/tooltip";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>,
);
