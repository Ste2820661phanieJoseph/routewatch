import { RateLimitViolation } from './rateLimitDetector';

export function formatRateLimitViolations(violations: RateLimitViolation[]): string {
  if (violations.length === 0) {
    return 'No rate limit violations detected.';
  }

  const lines: string[] = [
    `Rate Limit Violations (${violations.length} detected)`,
    '='.repeat(50),
  ];

  for (const v of violations) {
    const windowSec = (v.windowMs / 1000).toFixed(0);
    lines.push(
      `[${v.detectedAt.toISOString()}] ${v.method} ${v.route}` +
        ` — ${v.requestCount}/${v.maxRequests} requests in ${windowSec}s window`
    );
  }

  return lines.join('\n');
}

export function formatRateLimitViolationsJson(violations: RateLimitViolation[]): string {
  return JSON.stringify(
    violations.map((v) => ({
      ...v,
      detectedAt: v.detectedAt.toISOString(),
    })),
    null,
    2
  );
}

export function rateLimitViolationsToHtml(violations: RateLimitViolation[]): string {
  if (violations.length === 0) {
    return '<p class="no-violations">No rate limit violations detected.</p>';
  }

  const rows = violations
    .map((v) => {
      const windowSec = (v.windowMs / 1000).toFixed(0);
      return (
        `<tr class="violation">` +
        `<td>${escapeHtml(v.method)}</td>` +
        `<td>${escapeHtml(v.route)}</td>` +
        `<td>${v.requestCount}</td>` +
        `<td>${v.maxRequests}</td>` +
        `<td>${windowSec}s</td>` +
        `<td>${v.detectedAt.toISOString()}</td>` +
        `</tr>`
      );
    })
    .join('\n');

  return (
    `<table class="rate-limit-violations">` +
    `<thead><tr><th>Method</th><th>Route</th><th>Requests</th>` +
    `<th>Limit</th><th>Window</th><th>Detected At</th></tr></thead>` +
    `<tbody>${rows}</tbody></table>`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
