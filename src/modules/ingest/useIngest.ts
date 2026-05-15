// src/modules/ingest/useIngest.ts

import { useState, useCallback } from "react";
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
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const [board, setBoard] = useState("");
  const [part, setPartRaw] = useState("main");
  const [issue, setIssue] = useState<number | "">("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const [resolvedBoard, setResolvedBoard] = useState<BoardId | null>(null);
  const [checkSt, setCheckSt] = useState<StepStatus>("idle");
  const [checkErr, setCheckErr] = useState("");
  const [updSt, setUpdSt] = useState<StepStatus>("idle");
  const [updErr, setUpdErr] = useState("");
  const [updProg, setUpdProg] = useState("");

  const [resolvedData, setResolvedData] = useState<DataId | null>(null);
  const [dataSt, setDataSt] = useState<StepStatus>("idle");
  const [dataErr, setDataErr] = useState("");
  const [dataProg, setDataProg] = useState("");

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
    setInputKey((k) => k + 1);
  }, []);

  const setBoardSafe = useCallback(
    (v: string) => {
      setBoard(v);
      if (NO_NEW_PART_BOARDS.has(v) && part === "new") setPartRaw("main");
    },
    [part],
  );

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

  const runDataInner = (id: DataId) => {
    setDataSt("loading");
    setDataErr("");
    setDataProg("");
    streamSnapshot(id.date.toFormat("yyyy-MM-dd"), {
      onProgress: (m: string) => setDataProg(m),
      onComplete: () => setDataSt("success"),
      onError: (e: unknown) => {
        setDataSt("failed");
        setDataErr(e instanceof Error ? e.message : "处理失败");
      },
    });
  };

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
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setUploadError(e?.response?.data?.detail ?? e?.message ?? "上传失败");
      setPhase("configure");
    }
  }, [file, parseResult, board, part, issue]);

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
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setCheckSt("failed");
      setCheckErr(err?.response?.data?.message ?? err?.message ?? "检查失败");
    }
  }, [resolvedBoard]);

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
          onError: (e: unknown) => {
            setUpdSt("failed");
            setUpdErr(e instanceof Error ? e.message : "更新失败");
            ok();
          },
        },
      );
    });
  }, [resolvedBoard]);

  const runData = useCallback(async () => {
    if (!resolvedData) return;
    runDataInner(resolvedData);
  }, [resolvedData]);

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
    inputKey,
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
