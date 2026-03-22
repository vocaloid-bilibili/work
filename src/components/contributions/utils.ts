// src/components/contributions/utils.ts

/** 相对时间：刚刚 / n分钟前 / 昨天 HH:mm / MM-DD HH:mm */
export function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();

    if (diff < 0) return formatShort(d); // 未来时间兜底
    if (diff < 60_000) return "刚刚";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const hm = d.toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`;

    return formatShort(d);
  } catch {
    return iso;
  }
}

/** MM-DD HH:mm 短格式 */
export function formatShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
