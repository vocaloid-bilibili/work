// src/shared/ui/BackToTop.tsx
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/ui/cn";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full",
        "bg-foreground/80 text-background shadow-lg",
        "flex items-center justify-center",
        "hover:bg-foreground transition-all active:scale-90",
        "animate-in fade-in slide-in-from-bottom-4 duration-200",
      )}
      aria-label="回到顶部"
    >
      <ArrowUp className="h-4.5 w-4.5" />
    </button>
  );
}
