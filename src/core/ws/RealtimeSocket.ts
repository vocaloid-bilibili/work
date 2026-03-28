// src/core/ws/RealtimeSocket.ts
export type ConnState = "connecting" | "connected" | "reconnecting" | "offline";

export interface WsEvent {
  type: string;
  [k: string]: unknown;
}

interface Opts {
  urlProvider: () => Promise<string>;
  onMessage: (e: WsEvent) => void;
  onStatus: (s: ConnState) => void;
}

const HB = 15_000;
const STALE = 45_000;
const Q_MAX = 200;

export class RealtimeSocket {
  private opts: Opts;
  private ws: WebSocket | null = null;
  private manual = false;
  private attempt = 0;
  private hb: number | null = null;
  private stale: number | null = null;
  private reconTimer: number | null = null;
  private lastPong = 0;
  private queue: string[] = [];
  private joined = false;

  constructor(opts: Opts) {
    this.opts = opts;
  }

  async connect() {
    this.manual = false;
    this.joined = false;
    this.opts.onStatus(this.attempt > 0 ? "reconnecting" : "connecting");
    if (this.attempt > 0) this.queue = [];
    const url = await this.opts.urlProvider();
    if (!url) {
      this.opts.onStatus("offline");
      return;
    }
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.reconnect();
      return;
    }

    this.ws.onopen = () => {
      this.attempt = 0;
      this.lastPong = Date.now();
      this.opts.onStatus("connected");
      this.startHB();
    };
    this.ws.onmessage = (e) => {
      try {
        const d = JSON.parse(String(e.data)) as WsEvent;
        if (d.type === "pong") this.lastPong = Date.now();
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
      this.joined = false;
      if (this.manual) {
        this.opts.onStatus("offline");
        return;
      }
      this.reconnect();
    };
  }

  disconnect() {
    this.manual = true;
    this.joined = false;
    this.stopHB();
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
      if (this.ws?.readyState === 1) this.ws.send(msg);
      return;
    }
    if (this.joined && this.ws?.readyState === 1) {
      this.ws.send(msg);
      return;
    }
    if (data.type !== "ping" && this.queue.length < Q_MAX) this.queue.push(msg);
  }

  private flush() {
    if (!this.ws || this.ws.readyState !== 1) return;
    const q = this.queue.splice(0);
    for (const m of q) this.ws.send(m);
  }

  private reconnect() {
    this.attempt++;
    const delays = [1e3, 2e3, 5e3, 1e4, 15e3, 3e4];
    const w = delays[Math.min(this.attempt - 1, delays.length - 1)];
    this.opts.onStatus("reconnecting");
    this.reconTimer = window.setTimeout(() => this.connect(), w);
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
