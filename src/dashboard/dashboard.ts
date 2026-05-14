import { Router, Request, Response } from 'express';
import { getStore } from '../store/routeStore';
import { generateReport } from '../reporter/reporter';

export interface DashboardOptions {
  path?: string;
  format?: 'table' | 'json' | 'summary';
  title?: string;
}

const DEFAULT_OPTIONS: Required<DashboardOptions> = {
  path: '/__routewatch',
  format: 'table',
  title: 'RouteWatch Dashboard',
};

export function createDashboard(options: DashboardOptions = {}): Router {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const router = Router();

  router.get(opts.path, (_req: Request, res: Response) => {
    const store = getStore();
    const entries = Object.values(store);

    if (entries.length === 0) {
      res.status(200).json({
        title: opts.title,
        message: 'No routes have been recorded yet.',
        routes: [],
      });
      return;
    }

    if (opts.format === 'json') {
      const report = generateReport(entries, 'json');
      res.status(200).json({
        title: opts.title,
        data: JSON.parse(report),
      });
      return;
    }

    const report = generateReport(entries, opts.format);
    res.status(200).send(
      `<!DOCTYPE html><html><head><title>${opts.title}</title>` +
      `<style>body{font-family:monospace;background:#111;color:#0f0;padding:2rem;}` +
      `pre{white-space:pre-wrap;word-break:break-all;}</style></head>` +
      `<body><h1>${opts.title}</h1><pre>${escapeHtml(report)}</pre></body></html>`
    );
  });

  router.get(`${opts.path}/json`, (_req: Request, res: Response) => {
    const store = getStore();
    const entries = Object.values(store);
    const report = generateReport(entries, 'json');
    res.status(200).json(JSON.parse(report));
  });

  return router;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
