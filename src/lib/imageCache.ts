// src/lib/imageCache.ts

// ─── 内存层 ───
const mem = new Map<string, string>(); // originalUrl → blobUrl
const inflight = new Map<string, Promise<string>>();

// ─── IndexedDB 层 ───
const DB_NAME = "img-cache";
const STORE = "blobs";
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天

let _db: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  _db = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _db;
}

async function idbGet(key: string): Promise<{ blob: Blob; ts: number } | null> {
  try {
    const db = await getDB();
    return new Promise((res) => {
      const r = db.transaction(STORE).objectStore(STORE).get(key);
      r.onsuccess = () => res(r.result ?? null);
      r.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

async function idbPut(key: string, blob: Blob) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ blob, ts: Date.now() }, key);
  } catch {
    /* ignore */
  }
}

// 启动时清理过期条目
(async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (Date.now() - cursor.value.ts > MAX_AGE) cursor.delete();
      cursor.continue();
    };
  } catch {
    /* ignore */
  }
})();

// ─── 对外 API ───

/** 同步取内存缓存（命中返回 blobUrl，不命中返回 null） */
export function getCachedUrl(src: string): string | null {
  return mem.get(src) ?? null;
}

/** 异步加载并缓存，同一 URL 不会重复 fetch */
export function cacheImage(src: string): Promise<string> {
  // 1. 内存命中
  const hit = mem.get(src);
  if (hit) return Promise.resolve(hit);

  // 2. 去重：正在请求中
  const pending = inflight.get(src);
  if (pending) return pending;

  // 3. 实际加载
  const p = (async () => {
    // 先查 IndexedDB
    const stored = await idbGet(src);
    if (stored && Date.now() - stored.ts < MAX_AGE) {
      const url = URL.createObjectURL(stored.blob);
      mem.set(src, url);
      return url;
    }

    // 网络请求
    const resp = await fetch(src, { referrerPolicy: "no-referrer" });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    mem.set(src, url);
    idbPut(src, blob); // fire & forget
    return url;
  })()
    .catch(() => src) // 失败 fallback 原 URL
    .finally(() => inflight.delete(src));

  inflight.set(src, p);
  return p;
}
