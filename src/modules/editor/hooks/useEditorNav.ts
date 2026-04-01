// src/modules/editor/hooks/useEditorNav.ts
import { useState, useCallback, useEffect } from "react";
import type { ViewState } from "../types";

export function useEditorNav() {
  const [stack, setStack] = useState<ViewState[]>([{ type: "idle" }]);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  const push = useCallback((v: ViewState) => setStack((s) => [...s, v]), []);
  const pop = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const resetTo = useCallback(
    (v: ViewState) => setStack([{ type: "idle" }, v]),
    [],
  );
  const replace = useCallback(
    (v: ViewState) =>
      setStack((s) => {
        const next = [...s];
        next[next.length - 1] = v;
        return next;
      }),
    [],
  );
  const home = useCallback(() => setStack([{ type: "idle" }]), []);

  // 浏览器后退拦截
  useEffect(() => {
    if (stack.length <= 1) return;
    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      pop();
      window.history.pushState(null, "");
    };
    window.history.pushState(null, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [stack.length, pop]);

  return { stack, current, canGoBack, push, pop, resetTo, replace, home };
}

export type EditorNav = ReturnType<typeof useEditorNav>;
