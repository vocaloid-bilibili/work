// src/shell/App.tsx
import { BrowserRouter } from "react-router-dom";
import { Component, type ReactNode } from "react";
import Header from "./Header";
import Router from "./Router";
import { Toaster } from "@/ui/sonner";
import BackToTop from "@/shared/ui/BackToTop";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">出了点问题</h1>
          <pre className="text-sm text-destructive max-w-lg overflow-auto whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <Header />
          <main className="w-full grow">
            <Router />
          </main>
        </div>
        <BackToTop />
        <Toaster />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
