/**
 * Formatters for slow log detector output.
 * Provides text table, JSON, and HTML representations of slow route violations.
 */

import { SlowLogViolation } from "./slowLogDetector";

/**
 * Formats slow log violations as a human-readable text table.
 */
export function formatSlowLogViolations(violations: SlowLogViolation[]): string {
  if (violations.length === 0) {
    return "No slow log violations detected.";
  }

  const header = `${ "Route".padEnd(35) } ${ "Method".padEnd(8) } ${ "Duration (ms)".padEnd(15) } ${ "Threshold (ms)".padEnd(15) } Exceeded By`;
  const divider = "-".repeat(header.length);

  const rows = violations.map((v) => {
    const exceededBy = (v.durationMs - v.thresholdMs).toFixed(1);
    return [
      v.route.padEnd(35),
      v.method.padEnd(8),
      String(v.durationMs.toFixed(1)).padEnd(15),
      String(v.thresholdMs).padEnd(15),
      `+${exceededBy}ms`,
    ].join(" ");
  });

  return ["Slow Log Violations", divider, header, divider, ...rows, divider].join("\n");
}

/**
 * Formats slow log violations as a JSON string.
 */
export function formatSlowLogViolationsJson(violations: SlowLogViolation[]): string {
  return JSON.stringify(
    {
      slowLogViolations: violations.map((v) => ({
        route: v.route,
        method: v.method,
        durationMs: v.durationMs,
        thresholdMs: v.thresholdMs,
        exceededByMs: parseFloat((v.durationMs - v.thresholdMs).toFixed(1)),
        timestamp: v.timestamp,
      })),
      total: violations.length,
    },
    null,
    2
  );
}

/**
 * Escapes special HTML characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders slow log violations as an HTML table fragment.
 */
export function slowLogViolationsToHtml(violations: SlowLogViolation[]): string {
  if (violations.length === 0) {
    return "<p>No slow log violations detected.</p>";
  }

  const rows = violations
    .map((v) => {
      const exceededBy = (v.durationMs - v.thresholdMs).toFixed(1);
      return [
        "  <tr>",
        `    <td>${escapeHtml(v.method)}</td>`,
        `    <td>${escapeHtml(v.route)}</td>`,
        `    <td>${v.durationMs.toFixed(1)}</td>`,
        `    <td>${v.thresholdMs}</td>`,
        `    <td>+${escapeHtml(exceededBy)}ms</td>`,
        `    <td>${escapeHtml(new Date(v.timestamp).toISOString())}</td>`,
        "  </tr>",
      ].join("\n");
    })
    .join("\n");

  return [
    "<table>",
    "  <thead>",
    "    <tr>",
    "      <th>Method</th><th>Route</th><th>Duration (ms)</th><th>Threshold (ms)</th><th>Exceeded By</th><th>Timestamp</th>",
    "    </tr>",
    "  </thead>",
    "  <tbody>",
    rows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}
