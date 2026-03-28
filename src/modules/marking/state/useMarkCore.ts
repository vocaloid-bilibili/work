// src/modules/marking/state/useMarkCore.ts
import { useState, useRef } from "react";
import type { Row } from "@/core/types/collab";
import type { Attribution } from "@/core/types/stats";

export type LayoutMode = "list" | "grid" | "table";

export function useMarkCore() {
  const [records, setRecords] = useState<Row[]>([]);
  const [includes, setIncludes] = useState<boolean[]>([]);
  const [blacklists, setBlacklists] = useState<boolean[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [mode, setMode] = useState<"local" | "collab">(() =>
    localStorage.getItem("mark_mode") === "collab" ? "collab" : "local",
  );
  const [layout, setLayout] = useState<LayoutMode>(() => {
    const s = localStorage.getItem("mark_layout");
    return s === "grid" || s === "table" ? s : "list";
  });
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return {
    records,
    setRecords,
    includes,
    setIncludes,
    blacklists,
    setBlacklists,
    attributions,
    setAttributions,
    status,
    setStatus,
    mode,
    setMode,
    layout,
    setLayout,
    fileName,
    setFileName,
    fileRef,
  };
}
