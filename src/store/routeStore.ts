import { RouteEntry } from '../middleware/routewatch';

export interface RouteStats {
  method: string;
  path: string;
  hits: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  lastStatusCode: number;
  lastCalledAt: Date;
}

type RouteKey = string;

export class RouteStore {
  private static instance: RouteStore | null = null;
  private stats: Map<RouteKey, RouteStats> = new Map();
  private maxRoutes: number;

  private constructor(maxRoutes: number) {
    this.maxRoutes = maxRoutes;
  }

  static getInstance(maxRoutes = 500): RouteStore {
    if (!RouteStore.instance) {
      RouteStore.instance = new RouteStore(maxRoutes);
    }
    return RouteStore.instance;
  }

  /** Reset singleton — useful for testing */
  static reset(): void {
    RouteStore.instance = null;
  }

  record(entry: RouteEntry): void {
    const key: RouteKey = `${entry.method}:${entry.path}`;

    if (!this.stats.has(key)) {
      if (this.stats.size >= this.maxRoutes) return; // silently drop when at capacity
      this.stats.set(key, {
        method: entry.method,
        path: entry.path,
        hits: 0,
        avgResponseTimeMs: 0,
        minResponseTimeMs: Infinity,
        maxResponseTimeMs: -Infinity,
        lastStatusCode: entry.statusCode,
        lastCalledAt: entry.timestamp,
      });
    }

    const stat = this.stats.get(key)!;
    const prevTotal = stat.avgResponseTimeMs * stat.hits;
    stat.hits += 1;
    stat.avgResponseTimeMs = parseFloat(((prevTotal + entry.responseTimeMs) / stat.hits).toFixed(2));
    stat.minResponseTimeMs = Math.min(stat.minResponseTimeMs, entry.responseTimeMs);
    stat.maxResponseTimeMs = Math.max(stat.maxResponseTimeMs, entry.responseTimeMs);
    stat.lastStatusCode = entry.statusCode;
    stat.lastCalledAt = entry.timestamp;
  }

  getAll(): RouteStats[] {
    return Array.from(this.stats.values()).sort((a, b) => b.hits - a.hits);
  }

  getByKey(method: string, path: string): RouteStats | undefined {
    return this.stats.get(`${method.toUpperCase()}:${path}`);
  }

  clear(): void {
    this.stats.clear();
  }
}
