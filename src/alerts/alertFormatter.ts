import { AlertResult, AlertSeverity } from './alertManager';

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: 'ℹ️ ',
  warning: '⚠️ ',
  critical: '🚨',
};

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: '\x1b[36m',
  warning: '\x1b[33m',
  critical: '\x1b[31m',
};

const RESET = '\x1b[0m';

export function formatAlerts(alerts: AlertResult[], useColor = true): string {
  if (alerts.length === 0) {
    const ok = useColor ? `\x1b[32m✓ All checks passed${RESET}` : '✓ All checks passed';
    return ok;
  }

  const lines: string[] = [`${alerts.length} alert(s) detected:\n`];

  for (const alert of alerts) {
    const emoji = SEVERITY_EMOJI[alert.severity];
    const color = useColor ? SEVERITY_COLOR[alert.severity] : '';
    const reset = useColor ? RESET : '';
    const time = alert.triggeredAt.toISOString();
    lines.push(`  ${color}${emoji} [${alert.severity.toUpperCase()}] ${alert.message}${reset}`);
    lines.push(`     rule: ${alert.rule}  |  at: ${time}`);
  }

  return lines.join('\n');
}

export function formatAlertsJson(alerts: AlertResult[]): string {
  return JSON.stringify(
    alerts.map((a) => ({
      rule: a.rule,
      severity: a.severity,
      message: a.message,
      triggeredAt: a.triggeredAt.toISOString(),
    })),
    null,
    2
  );
}

export function alertsToHtml(alerts: AlertResult[]): string {
  if (alerts.length === 0) {
    return '<p class="alert-ok">✓ All checks passed</p>';
  }

  const items = alerts
    .map(
      (a) =>
        `<li class="alert alert-${a.severity}">` +
        `<strong>${a.severity.toUpperCase()}</strong>: ${escapeHtml(a.message)} ` +
        `<small>(${a.rule} @ ${a.triggeredAt.toISOString()})</small>` +
        `</li>`
    )
    .join('\n');

  return `<ul class="alert-list">\n${items}\n</ul>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
