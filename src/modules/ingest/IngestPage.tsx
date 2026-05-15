// src/modules/ingest/IngestPage.tsx

import { Card, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Progress } from "@/ui/progress";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  FileQuestion,
} from "lucide-react";
import { useIngest } from "./useIngest";
import { bLabel, pLabel, formatIssue } from "./types";
import StepRow from "./StepRow";

export default function IngestPage() {
  const s = useIngest();

  return (
    <div className="flex flex-col items-center p-8 w-full max-w-xl mx-auto">
      <Card className="w-full">
        <CardContent className="space-y-4 pt-6">
          {s.phase === "idle" && (
            <div className="space-y-3 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-3 text-sm text-muted-foreground">选择文件</p>
              <Input
                key={s.inputKey}
                type="file"
                onChange={s.handleFileChange}
                className="mx-auto max-w-xs cursor-pointer"
              />
            </div>
          )}

          {s.phase === "configure" && s.file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 truncate text-sm">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{s.file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={s.fullReset}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {s.parseResult?.type === "board" && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {bLabel(s.parseResult.id.board)} /{" "}
                    {pLabel(s.parseResult.id.part)} /{" "}
                    {formatIssue(s.parseResult.id)}
                  </span>
                </div>
              )}

              {s.parseResult?.type === "data" && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>
                    数据快照 {s.parseResult.id.date.toFormat("yyyy-MM-dd")}
                  </span>
                </div>
              )}

              {s.parseResult?.type === "unknown" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    <FileQuestion className="h-4 w-4 shrink-0" />
                    <span>特刊</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">板块</Label>
                      <Input
                        value={s.part}
                        onChange={(e) => s.setPart(e.target.value)}
                        placeholder="板块名称"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">期号</Label>
                      <Input
                        type="number"
                        value={s.issue}
                        onChange={(e) =>
                          s.setIssue(
                            e.target.value ? parseInt(e.target.value, 10) : "",
                          )
                        }
                        placeholder="期号"
                      />
                    </div>
                  </div>
                </div>
              )}

              {s.uploadError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-sm">{s.uploadError}</span>
                </div>
              )}

              <Button
                onClick={s.doUpload}
                disabled={!s.canUpload}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                上传
              </Button>
            </div>
          )}

          {s.phase === "uploading" && s.file && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 truncate rounded-lg bg-muted p-3 text-sm">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.file.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>上传中…</span>
                  <span>{Math.floor(s.uploadProgress)}%</span>
                </div>
                <Progress value={s.uploadProgress} />
              </div>
            </div>
          )}

          {s.phase === "process" && s.resolvedBoard && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  已上传 {bLabel(s.resolvedBoard.board)} /{" "}
                  {pLabel(s.resolvedBoard.part)} /{" "}
                  {formatIssue(s.resolvedBoard)}
                </span>
              </div>

              <StepRow
                label="检查"
                status={s.checkSt}
                error={s.checkErr}
                onAction={s.runCheck}
                actionLabel="检查"
              />
              <StepRow
                label="更新"
                status={s.updSt}
                error={s.updErr}
                onAction={s.runUpdate}
                actionLabel="更新"
                disabled={s.checkSt !== "success"}
              />
              {s.updSt === "loading" && s.updProg && (
                <div className="max-h-20 overflow-y-auto rounded bg-muted p-2 font-mono text-xs">
                  {s.updProg}
                </div>
              )}

              <Button
                variant="outline"
                onClick={s.fullReset}
                className="w-full"
                disabled={s.updSt === "loading"}
              >
                {s.updSt === "success" ? "继续上传" : "返回"}
              </Button>
            </div>
          )}

          {s.phase === "process" && s.resolvedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>
                  已上传 数据快照 {s.resolvedData.date.toFormat("yyyy-MM-dd")}
                </span>
              </div>

              <StepRow
                label="处理"
                status={s.dataSt}
                error={s.dataErr}
                onAction={s.runData}
                actionLabel="重试"
                showActionOnlyOnFail
              />
              {s.dataSt === "loading" && s.dataProg && (
                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
                  {s.dataProg}
                </div>
              )}

              <Button
                variant="outline"
                onClick={s.fullReset}
                className="w-full"
                disabled={s.dataSt === "loading"}
              >
                {s.dataSt === "success" ? "继续上传" : "返回"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
