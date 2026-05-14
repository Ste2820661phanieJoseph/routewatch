export interface RouteStats {
  method: string;
  path: string;
  count: number;
  avgDurationMs: number;
  lastCalledAt: Date | null;
  errorRate: number;
}

export function formatTable(stats: RouteStats[]): string {
  if (stats.length === 0) {
    return 'No routes recorded yet.\n';
  }

  const header = [
    'METHOD'.padEnd(8),
    'PATH'.padEnd(40),
    'COUNT'.padEnd(8),
    'AVG MS'.padEnd(10),
    'ERR %'.padEnd(8),
    'LAST CALLED',
  ].join(' | ');

  const divider = '-'.repeat(header.length);

  const rows = stats.map((s) => {
    const lastCalled = s.lastCalledAt
      ? s.lastCalledAt.toISOString()
      : 'never';
    return [
      s.method.padEnd(8),
      s.path.slice(0, 40).padEnd(40),
      String(s.count).padEnd(8),
      s.avgDurationMs.toFixed(2).padEnd(10),
      (s.errorRate * 100).toFixed(1).padEnd(8),
      lastCalled,
    ].join(' | ');
  });

  return [divider, header, divider, ...rows, divider].join('\n') + '\n';
}

export function formatJson(stats: RouteStats[]): string {
  return JSON.stringify(stats, null, 2);
}

export function formatSummary(stats: RouteStats[]): string {
  const totalRequests = stats.reduce((sum, s) => sum + s.count, 0);
  const uniqueRoutes = stats.length;
  const topRoute = stats.reduce(
    (top, s) => (s.count > (top?.count ?? -1) ? s : top),
    null as RouteStats | null
  );

  const lines = [
    `Total requests : ${totalRequests}`,
    `Unique routes  : ${uniqueRoutes}`,
    topRoute
      ? `Top route      : ${topRoute.method} ${topRoute.path} (${topRoute.count} hits)`
      : 'Top route      : N/A',
  ];

  return lines.join('\n') + '\n';
}
