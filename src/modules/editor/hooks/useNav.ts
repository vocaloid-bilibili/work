// src/modules/editor/hooks/useNav.ts
import { useState, useCallback, useEffect, useRef } from "react";
import type { View } from "../types";

export interface NavAPI {
  view: View;
  stack: View[];
  canBack: boolean;
  go: (v: View) => void;
  back: () => void;
  replace: (v: View) => void;
  home: () => void;
  push: (v: View) => void;
}

export function useNav(): NavAPI {
  const [stack, setStack] = useState<View[]>([{ id: "home" }]);
  const prev = useRef(1);

  const view = stack[stack.length - 1];
  const canBack = stack.length > 1;

  const go = useCallback((v: View) => setStack([{ id: "home" }, v]), []);
  const push = useCallback((v: View) => setStack((s) => [...s, v]), []);
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const replace = useCallback(
    (v: View) =>
      setStack((s) => {
        const n = [...s];
        n[n.length - 1] = v;
        return n;
      }),
    [],
  );
  const home = useCallback(() => setStack([{ id: "home" }]), []);

  useEffect(() => {
    if (stack.length <= 1) {
      prev.current = stack.length;
      return;
    }
    if (stack.length > prev.current) window.history.pushState(null, "");
    prev.current = stack.length;

    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      back();
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [stack.length, back]);

  return { view, stack, canBack, go, back, replace, home, push };
}
