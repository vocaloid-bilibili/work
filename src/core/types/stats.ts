// src/core/types/stats.ts
export interface UserProfile {
  id: string;
  username?: string;
  nickname?: string;
  avatar?: string | null;
}

export interface Attribution {
  actionByProfile?: UserProfile;
  action?: "include" | "exclude" | "blacklist";
  actionAt?: string;
  actionBy?: string;
}

export interface ContributorStats {
  user: UserProfile;
  totalOps: number;
  score: number;
  taskCount?: number;
  actions: Record<string, { count: number; score: number }>;
}

export interface LogEntry {
  opId: string;
  action: string;
  field: string;
  recordIndex: number;
  recordTitle?: string;
  bvid?: string;
  value?: unknown;
  user: UserProfile;
  at: string;
  source: "mark" | "edit";
}

export interface TaskStats {
  taskId: string;
  totalOperations: number;
  recordCount: number;
  totalIncluded: number;
  totalPending: number;
  totalBlacklisted: number;
  contributors: ContributorStats[];
}

export interface GlobalStats {
  taskCount: number;
  contributors: ContributorStats[];
  actionScores: Record<string, number>;
}

export interface TaskSummary {
  taskId: string;
  recordCount: number;
  createdAt: string;
  closedAt?: string;
  fileMeta?: {
    originalName: string;
    storedPath: string;
    uploadedAt: string;
  };
  contributorCount: number;
  totalOperations: number;
}
