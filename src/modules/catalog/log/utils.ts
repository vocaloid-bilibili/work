// src/modules/catalog/log/utils.ts

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

export function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} 天前`;
    return formatTime(iso);
  } catch {
    return iso;
  }
}
