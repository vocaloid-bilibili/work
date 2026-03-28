// src/modules/ingest/IngestPage.tsx
import { useState, useCallback } from "react";
import { checkRanking } from "@/core/api/mainEndpoints";
import { streamRanking, streamSnapshot } from "@/core/api/sseStream";
import { isBoardId, type BoardId, type DataId } from "@/core/helpers/filename";
import FileUploader from "./FileUploader";
import StepRow from "./StepRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/ui/dialog";
import { Button } from "@/ui/button";

type Status = "idle" | "loading" | "success" | "failed";
const BOARDS: Record<string, string> = {
  "vocaloid-daily": "日刊",
  "vocaloid-weekly": "周刊",
  "vocaloid-monthly": "月刊",
};
const PARTS: Record<string, string> = { main: "主榜", new: "新曲榜" };

export default function IngestPage() {
  const [board, setBoard] = useState<BoardId | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [checkSt, setCheckSt] = useState<Status>("idle");
  const [checkErr, setCheckErr] = useState("");
  const [updSt, setUpdSt] = useState<Status>("idle");
  const [updErr, setUpdErr] = useState("");
  const [progress, setProgress] = useState("");

  const [data, setData] = useState<DataId | null>(null);
  const [dataOpen, setDataOpen] = useState(false);
  const [dataSt, setDataSt] = useState<Status>("idle");
  const [dataErr, setDataErr] = useState("");
  const [dataProg, setDataProg] = useState("");

  const resetBoard = useCallback(() => {
    setCheckSt("idle");
    setCheckErr("");
    setUpdSt("idle");
    setUpdErr("");
    setProgress("");
  }, []);

  const onUpload = (id: BoardId | DataId) => {
    if (isBoardId(id)) {
      setBoard(id);
      resetBoard();
      setBoardOpen(true);
    } else {
      setData(id);
      setDataSt("idle");
      setDataErr("");
      setDataProg("");
      setDataOpen(true);
      runData(id);
    }
  };

  const runCheck = async () => {
    if (!board) return;
    setCheckSt("loading");
    setCheckErr("");
    try {
      const r = await checkRanking(board.board, board.part, board.issue);
      if (r.detail === "") setCheckSt("success");
      else {
        setCheckSt("failed");
        setCheckErr(r.detail);
      }
    } catch (e: any) {
      setCheckSt("failed");
      setCheckErr(e?.response?.data?.message || e.message || "检查失败");
    }
  };

  const runUpdate = async () => {
    if (!board) return;
    setUpdSt("loading");
    setUpdErr("");
    setProgress("");
    await new Promise<void>((ok) => {
      streamRanking(board.board, board.part, board.issue, {
        onProgress: setProgress,
        onComplete: () => {
          setUpdSt("success");
          ok();
        },
        onError: (e: any) => {
          setUpdSt("failed");
          setUpdErr(e?.message || "更新失败");
          ok();
        },
      });
    });
  };

  const runData = async (id: DataId) => {
    setDataSt("loading");
    setDataErr("");
    setDataProg("");
    await new Promise<void>((ok) => {
      streamSnapshot(id.date.toFormat("yyyy-MM-dd"), {
        onProgress: (m) => setDataProg(m),
        onComplete: () => {
          setDataSt("success");
          ok();
        },
        onError: (e: any) => {
          setDataSt("failed");
          setDataErr(e?.message || "处理失败");
          ok();
        },
      });
    });
  };

  return (
    <div className="flex flex-col items-center p-8 w-full max-w-xl mx-auto">
      <FileUploader onComplete={onUpload} />

      <Dialog open={boardOpen} onOpenChange={setBoardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>排名文件</DialogTitle>
            <DialogDescription>检查并更新排名数据</DialogDescription>
          </DialogHeader>
          {board && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded text-sm flex gap-4">
                <span>{BOARDS[board.board]}</span>
                <span>{PARTS[board.part]}</span>
                <span>第 {board.issue} 期</span>
              </div>
              <StepRow
                label="检查"
                status={checkSt}
                error={checkErr}
                onAction={runCheck}
                actionLabel="检查"
              />
              <StepRow
                label="更新"
                status={updSt}
                error={updErr}
                onAction={runUpdate}
                actionLabel="更新"
                disabled={checkSt !== "success"}
              />
              {updSt === "loading" && progress && (
                <div className="text-xs font-mono bg-muted p-2 rounded max-h-20 overflow-y-auto">
                  {progress}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setBoardOpen(false);
                if (updSt === "success") {
                  setBoard(null);
                  resetBoard();
                }
              }}
            >
              {updSt === "success" ? "完成" : "关闭"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dataOpen} onOpenChange={setDataOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>数据文件</DialogTitle>
            <DialogDescription>导入快照数据</DialogDescription>
          </DialogHeader>
          {data && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded text-sm">
                {data.date.toFormat("yyyy-MM-dd")}
              </div>
              <StepRow
                label="处理"
                status={dataSt}
                error={dataErr}
                onAction={() => runData(data)}
                actionLabel="重试"
                showActionOnlyOnFail
              />
              {dataSt === "loading" && dataProg && (
                <div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {dataProg}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setDataOpen(false);
                if (dataSt === "success") setData(null);
              }}
              disabled={dataSt === "loading"}
            >
              {dataSt === "success" ? "完成" : "关闭"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
