// src/components/mark/publish/types.ts

export interface BoardFile {
  type: "board";
  board: string;
  part: string;
  issue: number;
  filename: string;
  fileKey: string;
}

export interface SnapshotFile {
  type: "snapshot";
  date: string;
  filename: string;
  fileKey: string;
}

export type PublishFile = BoardFile | SnapshotFile;

export type FileStatus =
  | "pending"
  | "uploading"
  | "importing"
  | "done"
  | "error";

export type PublishPhase = "idle" | "checking" | "running" | "done" | "error";

export const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "等待中",
  uploading: "上传中",
  importing: "导入中",
  done: "完成",
  error: "失败",
};
