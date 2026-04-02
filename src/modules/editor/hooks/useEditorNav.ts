// src/modules/editor/hooks/useEditorNav.ts
import { useState, useCallback, useEffect, useRef } from "react";
import type { ViewState } from "../types";

export function useEditorNav() {
  const [stack, setStack] = useState<ViewState[]>([{ type: "idle" }]);
  const prevLen = useRef(1);

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

  useEffect(() => {
    if (stack.length <= 1) {
      prevLen.current = stack.length;
      return;
    }

    if (stack.length > prevLen.current) {
      window.history.pushState(null, "");
    }
    prevLen.current = stack.length;

    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      pop();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [stack.length, pop]);

  return { stack, current, canGoBack, push, pop, resetTo, replace, home };
}

export type EditorNav = ReturnType<typeof useEditorNav>;
