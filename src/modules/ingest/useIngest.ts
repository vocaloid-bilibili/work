// src/modules/ingest/useIngest.ts

import { useState, useRef, useCallback } from "react";
import {
  uploadFile,
  uploadRankingFile,
  checkRanking,
} from "@/core/api/mainEndpoints";
import { streamRanking, streamSnapshot } from "@/core/api/sseStream";
import type { BoardId, DataId } from "@/core/helpers/filename";
import { NO_NEW_PART_BOARDS } from "@/core/types/constants";
import type { StepStatus, Phase, ParseResult } from "./types";
import { tryParse } from "./types";

export function useIngest() {
  /* file */
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* manual params */
  const [board, setBoard] = useState("");
  const [part, setPartRaw] = useState("main");
  const [issue, setIssue] = useState<number | "">("");

  /* upload */
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  /* process — board */
  const [resolvedBoard, setResolvedBoard] = useState<BoardId | null>(null);
  const [checkSt, setCheckSt] = useState<StepStatus>("idle");
  const [checkErr, setCheckErr] = useState("");
  const [updSt, setUpdSt] = useState<StepStatus>("idle");
  const [updErr, setUpdErr] = useState("");
  const [updProg, setUpdProg] = useState("");

  /* process — data */
  const [resolvedData, setResolvedData] = useState<DataId | null>(null);
  const [dataSt, setDataSt] = useState<StepStatus>("idle");
  const [dataErr, setDataErr] = useState("");
  const [dataProg, setDataProg] = useState("");

  /* ─── reset ─── */
  const fullReset = useCallback(() => {
    setFile(null);
    setParseResult(null);
    setBoard("");
    setPartRaw("main");
    setIssue("");
    setPhase("idle");
    setUploadProgress(0);
    setUploadError("");
    setCheckSt("idle");
    setCheckErr("");
    setUpdSt("idle");
    setUpdErr("");
    setUpdProg("");
    setDataSt("idle");
    setDataErr("");
    setDataProg("");
    setResolvedBoard(null);
    setResolvedData(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  /* ─── board setter (auto-fix part) ─── */
  const setBoardSafe = useCallback(
    (v: string) => {
      setBoard(v);
      if (NO_NEW_PART_BOARDS.has(v) && part === "new") setPartRaw("main");
    },
    [part],
  );

  /* ─── file selected ─── */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;

      setUploadError("");
      setUploadProgress(0);
      setCheckSt("idle");
      setCheckErr("");
      setUpdSt("idle");
      setUpdErr("");
      setUpdProg("");
      setDataSt("idle");
      setDataErr("");
      setDataProg("");
      setResolvedBoard(null);
      setResolvedData(null);

      setFile(f);
      const result = tryParse(f.name);
      setParseResult(result);

      if (result.type === "board") {
        setBoard(result.id.board);
        setPartRaw(result.id.part);
        setIssue(result.id.issue);
      } else if (result.type === "unknown") {
        setBoard("special");
        setPartRaw("main");
        setIssue("");
      }
      setPhase("configure");
    },
    [],
  );

  /* ─── data processing (inner) ─── */
  const runDataInner = (id: DataId) => {
    setDataSt("loading");
    setDataErr("");
    setDataProg("");
    streamSnapshot(id.date.toFormat("yyyy-MM-dd"), {
      onProgress: (m: string) => setDataProg(m),
      onComplete: () => setDataSt("success"),
      onError: (e: any) => {
        setDataSt("failed");
        setDataErr(e?.message || "处理失败");
      },
    });
  };

  /* ─── upload ─── */
  const doUpload = useCallback(async () => {
    if (!file) return;
    setPhase("uploading");
    setUploadProgress(0);
    setUploadError("");

    try {
      if (parseResult?.type === "data") {
        await uploadFile(file, (p) => setUploadProgress(p * 100));
        setResolvedData(parseResult.id);
        setPhase("process");
        runDataInner(parseResult.id);
      } else if (parseResult?.type === "board") {
        await uploadFile(file, (p) => setUploadProgress(p * 100));
        setResolvedBoard(parseResult.id);
        setPhase("process");
      } else {
        if (!board || !part.trim() || typeof issue !== "number") return;
        const id: BoardId = {
          board: board as BoardId["board"],
          part: part as "main" | "new",
          issue,
        };
        await uploadRankingFile(file, board, part.trim(), issue, (p) =>
          setUploadProgress(p * 100),
        );
        setResolvedBoard(id);
        setPhase("process");
      }
    } catch (err: any) {
      setUploadError(err?.response?.data?.detail ?? err?.message ?? "上传失败");
      setPhase("configure");
    }
  }, [file, parseResult, board, part, issue]);

  /* ─── check ranking ─── */
  const runCheck = useCallback(async () => {
    if (!resolvedBoard) return;
    setCheckSt("loading");
    setCheckErr("");
    try {
      const r = await checkRanking(
        resolvedBoard.board,
        resolvedBoard.part,
        resolvedBoard.issue,
      );
      if (r.detail === "") setCheckSt("success");
      else {
        setCheckSt("failed");
        setCheckErr(r.detail);
      }
    } catch (e: any) {
      setCheckSt("failed");
      setCheckErr(e?.response?.data?.message || e.message || "检查失败");
    }
  }, [resolvedBoard]);

  /* ─── update ranking ─── */
  const runUpdate = useCallback(async () => {
    if (!resolvedBoard) return;
    setUpdSt("loading");
    setUpdErr("");
    setUpdProg("");
    await new Promise<void>((ok) => {
      streamRanking(
        resolvedBoard.board,
        resolvedBoard.part,
        resolvedBoard.issue,
        {
          onProgress: setUpdProg,
          onComplete: () => {
            setUpdSt("success");
            ok();
          },
          onError: (e: any) => {
            setUpdSt("failed");
            setUpdErr(e?.message || "更新失败");
            ok();
          },
        },
      );
    });
  }, [resolvedBoard]);

  /* ─── data processing (public) ─── */
  const runData = useCallback(async () => {
    if (!resolvedData) return;
    runDataInner(resolvedData);
  }, [resolvedData]);

  /* ─── canUpload ─── */
  const canUpload = (() => {
    if (!file) return false;
    if (parseResult?.type === "data" || parseResult?.type === "board")
      return true;
    return Boolean(board && part.trim() && typeof issue === "number");
  })();

  return {
    file,
    parseResult,
    board,
    part,
    issue,
    phase,
    uploadProgress,
    uploadError,
    resolvedBoard,
    checkSt,
    checkErr,
    updSt,
    updErr,
    updProg,
    resolvedData,
    dataSt,
    dataErr,
    dataProg,
    canUpload,
    inputRef,
    handleFileChange,
    setBoard: setBoardSafe,
    setPart: setPartRaw,
    setIssue,
    doUpload,
    runCheck,
    runUpdate,
    runData,
    fullReset,
  };
}
