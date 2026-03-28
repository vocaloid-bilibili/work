// src/shared/hooks/useDebounce.ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, ms = 500): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}
