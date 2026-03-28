// src/shell/App.tsx
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";
import Router from "./Router";
import { Toaster } from "@/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="w-full grow">
          <Router />
        </main>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}
