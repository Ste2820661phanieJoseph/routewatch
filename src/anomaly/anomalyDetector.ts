/**
 * Anomaly Detector
 *
 * Detects unusual patterns in route usage such as sudden traffic spikes,
 * error rate surges, or unexpected response time increases compared to
 * a rolling baseline.
 */

import { RouteStore } from '../store/routeStore';

export interface AnomalyRule {
  /** Unique name for this rule */
  name: string;
  /** Minimum number of requests required before anomaly detection kicks in */
  minSamples: number;
  /** Factor above the rolling average that triggers a spike anomaly (e.g. 3 = 3x normal) */
  spikeThreshold: number;
  /** Error rate (0–1) above which an error surge is flagged */
  errorRateThreshold: number;
  /** Response time (ms) multiplier above baseline that triggers a latency anomaly */
  latencyMultiplier: number;
}

export interface AnomalyViolation {
  rule: string;
  route: string;
  method: string;
  message: string;
  detectedAt: Date;
  value: number;
  baseline: number;
}

export interface AnomalyDetector {
  check: (store: RouteStore) => AnomalyViolation[];
  addRule: (rule: AnomalyRule) => void;
  getRules: () => AnomalyRule[];
}

/** Default anomaly detection rules */
export function createDefaultAnomalyRules(): AnomalyRule[] {
  return [
    {
      name: 'traffic-spike',
      minSamples: 10,
      spikeThreshold: 3,
      errorRateThreshold: 1,   // disabled for this rule
      latencyMultiplier: 999,  // disabled for this rule
    },
    {
      name: 'error-surge',
      minSamples: 5,
      spikeThreshold: 999,     // disabled for this rule
      errorRateThreshold: 0.5,
      latencyMultiplier: 999,  // disabled for this rule
    },
    {
      name: 'latency-spike',
      minSamples: 5,
      spikeThreshold: 999,     // disabled for this rule
      errorRateThreshold: 1,   // disabled for this rule
      latencyMultiplier: 3,
    },
  ];
}

/**
 * Creates an anomaly detector that analyses route entries from the store
 * and flags routes that deviate significantly from their own rolling baseline.
 */
export function createAnomalyDetector(
  rules: AnomalyRule[] = createDefaultAnomalyRules()
): AnomalyDetector {
  const _rules: AnomalyRule[] = [...rules];

  function check(store: RouteStore): AnomalyViolation[] {
    const violations: AnomalyViolation[] = [];
    const entries = store.getAll();

    // Group entries by route + method
    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = `${entry.method}:${entry.route}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }

    const now = Date.now();
    // Use a 5-minute window for "recent" vs full history as baseline
    const windowMs = 5 * 60 * 1000;

    for (const [key, routeEntries] of groups) {
      const [method, route] = key.split(/:(.+)/);
      if (routeEntries.length === 0) continue;

      const recent = routeEntries.filter(
        (e) => now - new Date(e.timestamp).getTime() < windowMs
      );
      const baseline = routeEntries;

      const baselineCount = baseline.length;
      const recentCount = recent.length;

      // Average requests per minute over baseline
      const baselineSpanMs = Math.max(
        1,
        now - new Date(baseline[0].timestamp).getTime()
      );
      const baselineRpm = (baselineCount / baselineSpanMs) * 60_000;
      const recentRpm = (recentCount / windowMs) * 60_000;

      const baselineErrors = baseline.filter((e) => e.statusCode >= 400).length;
      const recentErrors = recent.filter((e) => e.statusCode >= 400).length;
      const baselineErrorRate = baselineCount > 0 ? baselineErrors / baselineCount : 0;
      const recentErrorRate = recentCount > 0 ? recentErrors / recentCount : 0;

      const avg = (arr: number[]) =>
        arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

      const baselineLatency = avg(baseline.map((e) => e.responseTime));
      const recentLatency = avg(recent.map((e) => e.responseTime));

      for (const rule of _rules) {
        if (baselineCount < rule.minSamples) continue;

        // Traffic spike
        if (
          rule.spikeThreshold < 100 &&
          baselineRpm > 0 &&
          recentRpm > baselineRpm * rule.spikeThreshold
        ) {
          violations.push({
            rule: rule.name,
            route,
            method,
            message: `Traffic spike detected: ${recentRpm.toFixed(1)} req/min vs baseline ${baselineRpm.toFixed(1)} req/min`,
            detectedAt: new Date(),
            value: recentRpm,
            baseline: baselineRpm,
          });
        }

        // Error surge
        if (
          rule.errorRateThreshold < 1 &&
          recentCount >= rule.minSamples &&
          recentErrorRate > rule.errorRateThreshold &&
          recentErrorRate > baselineErrorRate * 1.5
        ) {
          violations.push({
            rule: rule.name,
            route,
            method,
            message: `Error surge detected: ${(recentErrorRate * 100).toFixed(1)}% error rate vs baseline ${(baselineErrorRate * 100).toFixed(1)}%`,
            detectedAt: new Date(),
            value: recentErrorRate,
            baseline: baselineErrorRate,
          });
        }

        // Latency spike
        if (
          rule.latencyMultiplier < 100 &&
          baselineLatency > 0 &&
          recentLatency > baselineLatency * rule.latencyMultiplier
        ) {
          violations.push({
            rule: rule.name,
            route,
            method,
            message: `Latency spike detected: ${recentLatency.toFixed(0)}ms vs baseline ${baselineLatency.toFixed(0)}ms`,
            detectedAt: new Date(),
            value: recentLatency,
            baseline: baselineLatency,
          });
        }
      }
    }

    return violations;
  }

  function addRule(rule: AnomalyRule): void {
    _rules.push(rule);
  }

  function getRules(): AnomalyRule[] {
    return [..._rules];
  }

  return { check, addRule, getRules };
}
