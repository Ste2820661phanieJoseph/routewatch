import { HealthCheckResult } from './healthCheckDetector';

const STATUS_ICONS: Record<HealthCheckResult['status'], string> = {
  healthy: '✅',
  degraded: '⚠️',
  unhealthy: '❌',
};

export function formatHealthCheckResults(results: HealthCheckResult[]): string {
  if (results.length === 0) return 'All routes are healthy.';

  const lines = ['Route Health Check Results', '='.repeat(40)];
  for (const r of results) {
    lines.push(
      `${STATUS_ICONS[r.status]} [${r.status.toUpperCase()}] ${r.route}`,
      `   Rule       : ${r.rule}`,
      `   Avg RT     : ${r.avgResponseTime.toFixed(1)}ms`,
      `   Success    : ${(r.successRate * 100).toFixed(1)}%`,
      `   Requests   : ${r.totalRequests}`,
      `   Message    : ${r.message}`,
      ''
    );
  }
  return lines.join('\n');
}

export function formatHealthCheckResultsJson(results: HealthCheckResult[]): string {
  return JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function healthCheckResultsToHtml(results: HealthCheckResult[]): string {
  if (results.length === 0) {
    return '<p class="healthy">All routes are healthy.</p>';
  }

  const rows = results
    .map(
      (r) =>
        `<tr class="${escapeHtml(r.status)}">
  <td>${escapeHtml(r.route)}</td>
  <td>${escapeHtml(r.status)}</td>
  <td>${r.avgResponseTime.toFixed(1)}ms</td>
  <td>${(r.successRate * 100).toFixed(1)}%</td>
  <td>${r.totalRequests}</td>
  <td>${escapeHtml(r.message)}</td>
</tr>`
    )
    .join('\n');

  return `<table class="healthcheck-table">
<thead><tr><th>Route</th><th>Status</th><th>Avg RT</th><th>Success Rate</th><th>Requests</th><th>Message</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
}
