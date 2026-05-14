import { getRouteStore } from '../store/routeStore';
import { RouteStats, formatTable, formatJson, formatSummary } from './formatters';

export type ReportFormat = 'table' | 'json' | 'summary';

export interface ReporterOptions {
  format?: ReportFormat;
}

function buildStats(): RouteStats[] {
  const store = getRouteStore();
  const entries = store.getAll();

  const grouped = new Map<string, typeof entries>();

  for (const entry of entries) {
    const key = `${entry.method}::${entry.path}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }

  const stats: RouteStats[] = [];

  for (const [key, group] of grouped.entries()) {
    const [method, path] = key.split('::');
    const count = group.length;
    const totalDuration = group.reduce((sum, e) => sum + (e.durationMs ?? 0), 0);
    const avgDurationMs = count > 0 ? totalDuration / count : 0;
    const errorCount = group.filter((e) => e.statusCode >= 400).length;
    const errorRate = count > 0 ? errorCount / count : 0;
    const lastCalledAt = group.reduce(
      (latest, e) =>
        !latest || e.timestamp > latest ? e.timestamp : latest,
      null as Date | null
    );

    stats.push({ method, path, count, avgDurationMs, errorRate, lastCalledAt });
  }

  return stats.sort((a, b) => b.count - a.count);
}

export function generateReport(options: ReporterOptions = {}): string {
  const { format = 'table' } = options;
  const stats = buildStats();

  switch (format) {
    case 'json':
      return formatJson(stats);
    case 'summary':
      return formatSummary(stats);
    case 'table':
    default:
      return formatTable(stats);
  }
}

export function printReport(options: ReporterOptions = {}): void {
  process.stdout.write(generateReport(options));
}
