// src/core/helpers/time.ts
export function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 0) return shortDate(d);
    if (diff < 6e4) return "刚刚";
    if (diff < 36e5) return `${Math.floor(diff / 6e4)}分钟前`;
    if (diff < 864e5) return `${Math.floor(diff / 36e5)}小时前`;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const hm = d.toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (d.toDateString() === y.toDateString()) return `昨天 ${hm}`;
    return shortDate(d);
  } catch {
    return iso;
  }
}

export function shortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
