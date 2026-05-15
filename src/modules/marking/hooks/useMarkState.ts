// src/modules/marking/hooks/useMarkState.ts
import { useState, useRef } from "react";
import type { Row } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";

export type LayoutMode = "list" | "grid";

export function useMarkState() {
  const [records, setRecords] = useState<Row[]>([]);
  const [includes, setIncludes] = useState<boolean[]>([]);
  const [blacklists, setBlacklists] = useState<boolean[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [mode, setMode] = useState<"local" | "collab">(() =>
    localStorage.getItem("mark_mode") === "collab" ? "collab" : "local",
  );
  const [layout, setLayout] = useState<LayoutMode>(() => {
    const saved = localStorage.getItem("mark_layout");
    return saved === "grid" ? "grid" : "list";
  });
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRecords([]);
    setIncludes([]);
    setBlacklists([]);
    setAttributions([]);
    setStatus("idle");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return {
    records, setRecords,
    includes, setIncludes,
    blacklists, setBlacklists,
    attributions, setAttributions,
    status, setStatus,
    mode, setMode,
    layout, setLayout,
    fileName, setFileName,
    fileRef,
    reset,
  };
}
