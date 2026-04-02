// src/shared/imageCache.ts
const mem = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const DB = "img-cache",
  STORE = "blobs",
  MAX_AGE = 7 * 864e5;

const MAX_MEM_ENTRIES = 200;

let _db: Promise<IDBDatabase> | null = null;
let _dbFailed = false;

function db() {
  if (_dbFailed) return Promise.reject(new Error("IDB unavailable"));
  if (_db) return _db;
  _db = new Promise<IDBDatabase>((ok, fail) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE))
          r.result.createObjectStore(STORE);
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => {
        _dbFailed = true;
        fail(r.error);
      };
    } catch {
      _dbFailed = true;
      fail(new Error("IndexedDB not available"));
    }
  });
  return _db;
}

async function idbGet(k: string) {
  try {
    const d = await db();
    return new Promise<{ blob: Blob; ts: number } | null>((r) => {
      const q = d.transaction(STORE).objectStore(STORE).get(k);
      q.onsuccess = () => r(q.result ?? null);
      q.onerror = () => r(null);
    });
  } catch {
    return null;
  }
}
async function idbPut(k: string, b: Blob) {
  try {
    const d = await db();
    d.transaction(STORE, "readwrite")
      .objectStore(STORE)
      .put({ blob: b, ts: Date.now() }, k);
  } catch {
    /**/
  }
}

void (async () => {
  try {
    const d = await db();
    const r = d.transaction(STORE, "readwrite").objectStore(STORE).openCursor();
    r.onsuccess = () => {
      const c = r.result;
      if (!c) return;
      if (Date.now() - c.value.ts > MAX_AGE) c.delete();
      c.continue();
    };
  } catch {
    /**/
  }
})();

function evictIfNeeded() {
  if (mem.size <= MAX_MEM_ENTRIES) return;
  const first = mem.entries().next().value;
  if (first) {
    const [src] = first;
    mem.delete(src);
  }
}

export const getCached = (src: string) => mem.get(src) ?? null;

export function cacheImg(src: string): Promise<string> {
  const hit = mem.get(src);
  if (hit) return Promise.resolve(hit);
  const p2 = pending.get(src);
  if (p2) return p2;
  const p = (async () => {
    const stored = await idbGet(src);
    if (stored && Date.now() - stored.ts < MAX_AGE) {
      const u = URL.createObjectURL(stored.blob);
      mem.set(src, u);
      evictIfNeeded();
      return u;
    }
    const r = await fetch(src, { referrerPolicy: "no-referrer" });
    if (!r.ok) throw 0;
    const b = await r.blob();
    const u = URL.createObjectURL(b);
    mem.set(src, u);
    evictIfNeeded();
    idbPut(src, b);
    return u;
  })()
    .catch(() => src)
    .finally(() => pending.delete(src));
  pending.set(src, p);
  return p;
}
