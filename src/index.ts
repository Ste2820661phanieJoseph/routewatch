/**
 * routewatch — Lightweight Express middleware that logs and visualizes
 * API route usage patterns in real time.
 *
 * Main entry point: re-exports all public APIs for consumers.
 */

// Core middleware
export { routewatch } from './middleware/routewatch';

// Route store
export type { RouteEntry, RouteStore } from './store/routeStore';
export { createRouteStore } from './store/routeStore';

// Reporter
export { buildStats, generateReport, printReport } from './reporter/reporter';
export { formatTable, formatJson, formatSummary } from './reporter/formatters';

// Dashboard
export { createDashboard, escapeHtml as escapeDashboardHtml } from './dashboard/dashboard';

// Alerts
export { createDefaultRules } from './alerts/alertManager';
export type { AlertRule, AlertResult } from './alerts/alertManager';
export {
  formatAlerts,
  formatAlertsJson,
  alertsToHtml,
} from './alerts/alertFormatter';

// Exporter
export { toCSV, exportRouteData } from './exporter/exporter';

// Rate limit detection
export {
  createRateLimitDetector,
} from './ratelimit/rateLimitDetector';
export type { RateLimitRule, RateLimitViolation } from './ratelimit/rateLimitDetector';
export {
  formatRateLimitViolations,
  formatRateLimitViolationsJson,
  rateLimitViolationsToHtml,
} from './ratelimit/rateLimitFormatter';

// Slow log detection
export {
  createSlowLogDetector,
} from './slowlog/slowLogDetector';
export type { SlowLogRule, SlowLogViolation } from './slowlog/slowLogDetector';
export {
  formatSlowLogViolations,
  formatSlowLogViolationsJson,
  slowLogViolationsToHtml,
} from './slowlog/slowLogFormatter';
