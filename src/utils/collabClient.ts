// src/utils/collabClient.ts

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

interface ClientEvent {
  type: "ping" | "join_task" | "submit_operation";
  taskId?: string;
  operation?: unknown;
}

interface CollabClientOptions {
  baseProvider: () => string;
  tokenProvider: () => Promise<string | null>;
  onMessage: (event: ServerEvent) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export interface ServerEvent {
  type:
    | "connected"
    | "task_joined"
    | "operation_committed"
    | "operation_conflicted"
    | "snapshot_reloaded"
    | "pong"
    | "error";
  [key: string]: unknown;
}

const HEARTBEAT_INTERVAL = 15_000;
const STALE_TIMEOUT = 45_000;
const MAX_QUEUE_SIZE = 200;

export class CollabClient {
  private readonly baseProvider: () => string;
  private readonly tokenProvider: () => Promise<string | null>;
  private readonly onMessage: (event: ServerEvent) => void;
  private readonly onStatusChange: (status: ConnectionStatus) => void;

  private socket: WebSocket | null = null;
  private manualClose = false;
  private reconnectAttempt = 0;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private lastPongAt = 0;
  private staleCheckTimer: number | null = null;
  private messageQueue: string[] = [];
  private joined = false;

  constructor(options: CollabClientOptions) {
    this.baseProvider = options.baseProvider;
    this.tokenProvider = options.tokenProvider;
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
  }

  async connect(): Promise<void> {
    this.manualClose = false;
    this.joined = false;
    this.onStatusChange(
      this.reconnectAttempt > 0 ? "reconnecting" : "connecting",
    );
    if (this.reconnectAttempt > 0) {
      this.messageQueue = [];
    }
    const token = await this.tokenProvider();
    if (!token) {
      this.onStatusChange("offline");
      return;
    }

    const wsUrl = this.makeWsUrl(token);

    try {
      this.socket = new WebSocket(wsUrl);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.lastPongAt = Date.now();
      this.onStatusChange("connected");
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as ServerEvent;
        if (!parsed || !parsed.type) return;

        if (parsed.type === "pong") {
          this.lastPongAt = Date.now();
        }

        if (parsed.type === "task_joined") {
          this.joined = true;
          this.flushQueue();
        }

        this.onMessage(parsed);
      } catch {}
    };

    this.socket.onerror = () => {};

    this.socket.onclose = () => {
      this.stopHeartbeat();
      this.joined = false;
      if (this.manualClose) {
        this.onStatusChange("offline");
        return;
      }
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.manualClose = true;
    this.joined = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.messageQueue = [];
    this.socket?.close();
    this.socket = null;
    this.onStatusChange("offline");
  }

  send(event: ClientEvent): void {
    const msg = JSON.stringify(event);

    if (event.type === "join_task") {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(msg);
      }
      return;
    }

    if (
      this.joined &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.socket.send(msg);
      return;
    }

    if (event.type !== "ping" && this.messageQueue.length < MAX_QUEUE_SIZE) {
      this.messageQueue.push(msg);
    }
  }

  private flushQueue(): void {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN ||
      this.messageQueue.length === 0
    ) {
      return;
    }
    const queue = this.messageQueue.splice(0);
    for (const msg of queue) {
      this.socket.send(msg);
    }
  }

  private makeWsUrl(token: string): string {
    const source = new URL(this.baseProvider());
    source.protocol = source.protocol === "https:" ? "wss:" : "ws:";
    source.pathname = source.pathname.replace(/\/$/, "") + "/ws";
    source.searchParams.set("token", token);
    return source.toString();
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt += 1;
    const delays = [1000, 2000, 5000, 10000, 15000, 30000];
    const wait = delays[Math.min(this.reconnectAttempt - 1, delays.length - 1)];
    this.onStatusChange("reconnecting");
    this.reconnectTimer = window.setTimeout(() => {
      void this.connect();
    }, wait);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongAt = Date.now();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);

    this.staleCheckTimer = window.setInterval(() => {
      if (Date.now() - this.lastPongAt > STALE_TIMEOUT) {
        console.warn("[CollabClient] 连接僵死，强制重连");
        this.socket?.close();
      }
    }, STALE_TIMEOUT);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.staleCheckTimer) {
      window.clearInterval(this.staleCheckTimer);
      this.staleCheckTimer = null;
    }
  }
}
