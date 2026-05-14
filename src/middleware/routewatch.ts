import { Request, Response, NextFunction } from 'express';
import { RouteStore } from '../store/routeStore';

export interface RouteWatchOptions {
  /** Maximum number of routes to track (default: 500) */
  maxRoutes?: number;
  /** Whether to include query params in route key (default: false) */
  includeQuery?: boolean;
  /** Custom logger function (default: none) */
  logger?: (entry: RouteEntry) => void;
}

export interface RouteEntry {
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: Date;
}

const defaultOptions: Required<RouteWatchOptions> = {
  maxRoutes: 500,
  includeQuery: false,
  logger: () => {},
};

export function routewatch(options: RouteWatchOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const store = RouteStore.getInstance(opts.maxRoutes);

  return function routewatchMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const responseTimeMs = Number(durationNs) / 1_000_000;

      const routePath = opts.includeQuery && req.query && Object.keys(req.query).length > 0
        ? `${req.path}?${new URLSearchParams(req.query as Record<string, string>).toString()}`
        : req.path;

      const entry: RouteEntry = {
        method: req.method.toUpperCase(),
        path: routePath,
        statusCode: res.statusCode,
        responseTimeMs: parseFloat(responseTimeMs.toFixed(2)),
        timestamp: new Date(),
      };

      store.record(entry);

      if (opts.logger) {
        opts.logger(entry);
      }
    });

    next();
  };
}
