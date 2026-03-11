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

  constructor(options: CollabClientOptions) {
    this.baseProvider = options.baseProvider;
    this.tokenProvider = options.tokenProvider;
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
  }

  async connect(): Promise<void> {
    this.manualClose = false;
    this.onStatusChange(
      this.reconnectAttempt > 0 ? "reconnecting" : "connecting",
    );

    const token = await this.tokenProvider();
    if (!token) {
      this.onStatusChange("offline");
      return;
    }

    const wsUrl = this.makeWsUrl(token);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.onStatusChange("connected");
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as ServerEvent;
        if (parsed && parsed.type) {
          this.onMessage(parsed);
        }
      } catch {
        this.onMessage({ type: "error", message: "消息解析失败" });
      }
    };

    this.socket.onerror = () => {
      this.onStatusChange("reconnecting");
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      if (this.manualClose) {
        this.onStatusChange("offline");
        return;
      }
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.onStatusChange("offline");
  }

  send(event: ClientEvent): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(event));
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
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: "ping" });
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
