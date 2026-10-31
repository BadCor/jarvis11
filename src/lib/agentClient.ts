import { AgentStatus } from '../types/jarvis';

export const DEFAULT_AGENT_URL = 'http://127.0.0.1:8765';

export interface CommandResponse {
  success: boolean;
  message: string;
  latencyMs?: number;
  statusCode?: number;
}

export class AgentClient {
  private url: string;
  private status: AgentStatus = 'disconnected';
  private listeners: Set<(status: AgentStatus, latencyMs?: number) => void> = new Set();
  private pollInterval: number | null = null;
  private lastLatency: number | null = null;

  constructor(initialUrl = DEFAULT_AGENT_URL) {
    this.url = initialUrl;
  }

  public getUrl(): string {
    return this.url;
  }

  public setUrl(newUrl: string): void {
    this.url = newUrl.replace(/\/+$/, '');
    this.checkHealth();
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getLastLatency(): number | null {
    return this.lastLatency;
  }

  public subscribe(listener: (status: AgentStatus, latencyMs?: number) => void): () => void {
    this.listeners.add(listener);
    listener(this.status, this.lastLatency ?? undefined);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(latency?: number) {
    this.listeners.forEach((l) => l(this.status, latency));
  }

  public async checkHealth(): Promise<{ isOnline: boolean; latencyMs: number }> {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      // Send a lightweight OPTIONS or POST with empty body
      const res = await fetch(`${this.url}/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json, text/plain, */*' },
      }).catch(async () => {
        // Fallback probe to / with HEAD or OPTIONS
        return await fetch(this.url, { method: 'OPTIONS', signal: controller.signal });
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);
      this.lastLatency = latencyMs;
      this.status = 'connected';
      this.notify(latencyMs);
      return { isOnline: true, latencyMs };
    } catch {
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);
      this.status = 'disconnected';
      this.notify(latencyMs);
      return { isOnline: false, latencyMs };
    }
  }

  public async sendCommand(commandText: string): Promise<CommandResponse> {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${this.url}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: commandText,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);
      this.status = 'connected';
      this.lastLatency = latencyMs;
      this.notify(latencyMs);

      if (res.ok || res.status === 204 || res.status === 200) {
        return {
          success: true,
          message: `Команда «${commandText}» успешно передана в Windows Agent`,
          latencyMs,
          statusCode: res.status,
        };
      } else {
        return {
          success: false,
          message: `Агент вернул код ошибки: ${res.status}`,
          latencyMs,
          statusCode: res.status,
        };
      }
    } catch (err: unknown) {
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);
      this.status = 'disconnected';
      this.notify(latencyMs);
      const isAbort = err instanceof Error && err.name === 'AbortError';

      return {
        success: false,
        message: isAbort
          ? 'Таймаут соединения с Windows Agent (порт 8765 не ответил)'
          : 'Windows Agent недоступен (127.0.0.1:8765). Запустите jarvis_bridge.py',
        latencyMs,
      };
    }
  }

  public startAutoCheck(intervalMs = 6000): void {
    this.stopAutoCheck();
    this.checkHealth();
    this.pollInterval = window.setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  public stopAutoCheck(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const agentClient = new AgentClient();
