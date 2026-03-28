// src/core/auth/roles.ts
const LEVELS: Record<string, number> = {
  user: 0,
  worker: 1,
  sponsor: 2,
  admin: 3,
  superuser: 4,
};
const MIN = "worker";
export const hasAccess = (role: string) =>
  (LEVELS[role] ?? -1) >= (LEVELS[MIN] ?? 999);
