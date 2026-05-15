import { RouteStore } from '../store/routeStore';

export interface HealthCheckRule {
  name: string;
  routePattern: RegExp;
  maxResponseTime?: number;
  minSuccessRate?: number;
}

export interface HealthCheckResult {
  rule: string;
  route: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  avgResponseTime: number;
  successRate: number;
  totalRequests: number;
  message: string;
}

const DEFAULT_RULES: HealthCheckRule[] = [
  { name: 'slow-health-endpoint', routePattern: /\/health/i, maxResponseTime: 200 },
  { name: 'low-success-rate', routePattern: /.*/, minSuccessRate: 0.95 },
];

export function createHealthCheckDetector(store: RouteStore) {
  let rules: HealthCheckRule[] = [...DEFAULT_RULES];

  function addRule(rule: HealthCheckRule): void {
    rules.push(rule);
  }

  function getRules(): HealthCheckRule[] {
    return [...rules];
  }

  function check(): HealthCheckResult[] {
    const results: HealthCheckResult[] = [];
    const entries = store.getAll();

    for (const entry of entries) {
      for (const rule of rules) {
        if (!rule.routePattern.test(entry.path)) continue;

        const total = entry.count;
        const successCount = entry.statusCodes
          ? Object.entries(entry.statusCodes)
              .filter(([code]) => Number(code) < 400)
              .reduce((sum, [, cnt]) => sum + cnt, 0)
          : total;

        const successRate = total > 0 ? successCount / total : 1;
        const avgResponseTime = entry.avgDuration ?? 0;

        let status: HealthCheckResult['status'] = 'healthy';
        const issues: string[] = [];

        if (rule.maxResponseTime !== undefined && avgResponseTime > rule.maxResponseTime) {
          status = avgResponseTime > rule.maxResponseTime * 2 ? 'unhealthy' : 'degraded';
          issues.push(`avg response time ${avgResponseTime.toFixed(1)}ms exceeds ${rule.maxResponseTime}ms`);
        }

        if (rule.minSuccessRate !== undefined && successRate < rule.minSuccessRate) {
          status = successRate < rule.minSuccessRate * 0.9 ? 'unhealthy' : 'degraded';
          issues.push(`success rate ${(successRate * 100).toFixed(1)}% below ${(rule.minSuccessRate * 100).toFixed(1)}%`);
        }

        if (issues.length > 0) {
          results.push({
            rule: rule.name,
            route: `${entry.method} ${entry.path}`,
            status,
            avgResponseTime,
            successRate,
            totalRequests: total,
            message: issues.join('; '),
          });
        }
      }
    }

    return results;
  }

  return { check, addRule, getRules };
}
