// src/core/ws/RealtimeSocket.ts
export type ConnState = "connecting" | "connected" | "reconnecting" | "offline";

export interface WsEvent {
  type: string;
  [k: string]: unknown;
}

interface Opts {
  urlProvider: () => Promise<string>;
  tokenProvider: () => Promise<string | null>;
  onMessage: (e: WsEvent) => void;
  onStatus: (s: ConnState) => void;
}

const HB = 15_000;
const STALE = 45_000;
const Q_MAX = 200;
const AUTH_TIMEOUT = 10_000;
const RECON_DELAYS = [1e3, 2e3, 5e3, 1e4, 15e3, 3e4] as const;

export class RealtimeSocket {
  private opts: Opts;
  private ws: WebSocket | null = null;
  private manual = false;
  private attempt = 0;
  private hb: number | null = null;
  private stale: number | null = null;
  private reconTimer: number | null = null;
  private authTimer: number | null = null;
  private lastPong = 0;
  private queue: string[] = [];
  private joined = false;
  private authenticated = false;

  constructor(opts: Opts) {
    this.opts = opts;
  }

  async connect() {
    this.manual = false;
    this.joined = false;
    this.authenticated = false;
    this.opts.onStatus(this.attempt > 0 ? "reconnecting" : "connecting");
    if (this.attempt > 0) this.queue = [];

    const [url, token] = await Promise.all([
      this.opts.urlProvider(),
      this.opts.tokenProvider(),
    ]);
    if (!url || !token) {
      this.opts.onStatus("offline");
      return;
    }

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.lastPong = Date.now();
      this.ws!.send(JSON.stringify({ type: "auth", token }));
      this.authTimer = window.setTimeout(() => {
        if (!this.authenticated) {
          console.warn("[ws] 认证超时，断开重连");
          this.ws?.close();
        }
      }, AUTH_TIMEOUT);
    };

    this.ws.onmessage = (e) => {
      try {
        const d = JSON.parse(String(e.data)) as WsEvent;

        if (d.type === "pong") {
          this.lastPong = Date.now();
          return;
        }

        if (d.type === "connected" && !this.authenticated) {
          this.authenticated = true;
          this.attempt = 0;
          this.clearAuthTimer();
          this.opts.onStatus("connected");
          this.startHB();
          this.opts.onMessage(d);
          return;
        }

        if (d.type === "task_joined") {
          this.joined = true;
          this.flush();
        }

        this.opts.onMessage(d);
      } catch {
        /* skip */
      }
    };

    this.ws.onerror = () => {};

    this.ws.onclose = () => {
      this.stopHB();
      this.clearAuthTimer();
      this.joined = false;
      this.authenticated = false;
      if (this.manual) {
        this.opts.onStatus("offline");
        return;
      }
      this.scheduleReconnect();
    };
  }

  disconnect() {
    this.manual = true;
    this.joined = false;
    this.authenticated = false;
    this.stopHB();
    this.clearAuthTimer();
    this.queue = [];
    if (this.reconTimer) {
      clearTimeout(this.reconTimer);
      this.reconTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.opts.onStatus("offline");
  }

  send(data: Record<string, unknown>) {
    const msg = JSON.stringify(data);

    if (data.type === "join_task") {
      if (this.authenticated && this.ws?.readyState === 1) this.ws.send(msg);
      return;
    }

    if (this.joined && this.authenticated && this.ws?.readyState === 1) {
      this.ws.send(msg);
      return;
    }

    if (data.type !== "ping" && this.queue.length < Q_MAX) this.queue.push(msg);
  }

  private flush() {
    if (!this.ws || this.ws.readyState !== 1 || !this.authenticated) return;
    const q = this.queue.splice(0);
    for (const m of q) this.ws.send(m);
  }

  private scheduleReconnect() {
    this.attempt++;
    const w = RECON_DELAYS[Math.min(this.attempt - 1, RECON_DELAYS.length - 1)];
    this.opts.onStatus("reconnecting");
    this.reconTimer = window.setTimeout(() => this.connect(), w);
  }

  private clearAuthTimer() {
    if (this.authTimer) {
      clearTimeout(this.authTimer);
      this.authTimer = null;
    }
  }

  private startHB() {
    this.stopHB();
    this.lastPong = Date.now();
    this.hb = window.setInterval(() => {
      if (this.ws?.readyState === 1) this.ws.send('{"type":"ping"}');
    }, HB);
    this.stale = window.setInterval(() => {
      if (Date.now() - this.lastPong > STALE) this.ws?.close();
    }, STALE);
  }

  private stopHB() {
    if (this.hb) {
      clearInterval(this.hb);
      this.hb = null;
    }
    if (this.stale) {
      clearInterval(this.stale);
      this.stale = null;
    }
  }
}
