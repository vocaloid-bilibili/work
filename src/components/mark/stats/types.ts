export interface UserProfile {
  id: string;
  username?: string;
  nickname?: string;
  avatar?: string | null;
}

export interface ContributorStats {
  user: UserProfile;
  totalOps: number;
  includes: number;
  blacklists: number;
  fieldEdits: number;
}

export interface EnrichedLogEntry {
  opId: string;
  action: "set" | "toggle_include" | "blacklist" | "unblacklist";
  field: string;
  recordIndex: number;
  recordTitle?: string;
  bvid?: string;
  value?: unknown;
  user: UserProfile;
  at: string;
}

export interface TaskStats {
  taskId: string;
  totalOperations: number;
  recordCount: number;
  totalIncluded: number;
  totalExcluded: number;
  totalBlacklisted: number;
  contributors: ContributorStats[];
  fieldBreakdown: Record<string, number>;
  recentOps: EnrichedLogEntry[];
}

export interface TaskSummaryItem {
  taskId: string;
  recordCount: number;
  createdAt: string;
  closedAt?: string;
  fileMeta?: { originalName: string; storedPath: string; uploadedAt: string };
  contributorCount: number;
  totalOperations: number;
}

export interface RecordAttribution {
  actionBy?: string;
  actionByProfile?: UserProfile;
  action?: "include" | "exclude" | "blacklist";
  actionAt?: string;
}
