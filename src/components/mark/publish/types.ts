// src/components/mark/publish/types.ts

export type PublishMode = "full" | "download_import" | "import_only";

export const MODE_OPTIONS: {
  mode: PublishMode;
  label: string;
  desc: string;
}[] = [
  {
    mode: "full",
    label: "全套发布",
    desc: "导出 → 上传 → 服务器处理 → 下载 → 导入数据库",
  },
  {
    mode: "download_import",
    label: "下载并导入",
    desc: "下载服务器最新文件 → 导入数据库（服务器已处理过）",
  },
  {
    mode: "import_only",
    label: "仅导入数据库",
    desc: "使用已下载的文件直接导入数据库",
  },
];

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
  | "downloading"
  | "uploading"
  | "importing"
  | "done"
  | "error";

export type PublishPhase =
  | "idle"
  | "checking"
  | "phase1"
  | "phase2"
  | "done"
  | "error";

export const STATUS_LABEL: Record<FileStatus, string> = {
  pending: "等待中",
  downloading: "下载中",
  uploading: "上传中",
  importing: "导入中",
  done: "完成",
  error: "失败",
};
