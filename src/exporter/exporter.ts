import * as fs from 'fs';
import * as path from 'path';
import { RouteStore } from '../store/routeStore';
import { buildStats } from '../reporter/reporter';
import { formatJson, formatTable } from '../reporter/formatters';

export type ExportFormat = 'json' | 'csv' | 'table';

export interface ExportOptions {
  format: ExportFormat;
  outputDir?: string;
  filename?: string;
}

function toCSV(store: RouteStore): string {
  const stats = buildStats(store);
  const header = 'method,path,count,avgDurationMs,lastCalledAt';
  const rows = stats.map((s) => {
    const last = s.lastCalledAt ? new Date(s.lastCalledAt).toISOString() : '';
    return `${s.method},${s.path},${s.count},${s.avgDurationMs.toFixed(2)},${last}`;
  });
  return [header, ...rows].join('\n');
}

export function exportRouteData(
  store: RouteStore,
  options: ExportOptions
): string {
  const { format, outputDir = '.', filename } = options;

  let content: string;
  let ext: string;

  switch (format) {
    case 'json':
      content = formatJson(store);
      ext = 'json';
      break;
    case 'csv':
      content = toCSV(store);
      ext = 'csv';
      break;
    case 'table':
    default:
      content = formatTable(store);
      ext = 'txt';
      break;
  }

  const resolvedFilename = filename ?? `routewatch-export-${Date.now()}.${ext}`;
  const outputPath = path.join(outputDir, resolvedFilename);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');

  return outputPath;
}
