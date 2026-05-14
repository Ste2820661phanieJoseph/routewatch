import { RouteStore } from '../store/routeStore';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  name: string;
  description: string;
  severity: AlertSeverity;
  check: (store: RouteStore) => AlertResult | null;
}

export interface AlertResult {
  rule: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: Date;
}

const DEFAULT_ERROR_RATE_THRESHOLD = 0.2;
const DEFAULT_HIGH_LATENCY_MS = 2000;
const DEFAULT_HIGH_VOLUME_RPM = 100;

export function createDefaultRules(): AlertRule[] {
  return [
    {
      name: 'high-error-rate',
      description: 'Fires when any route has >20% error rate',
      severity: 'critical',
      check(store) {
        const entries = store.getAll();
        for (const entry of entries) {
          const errorRate = entry.errorCount / (entry.count || 1);
          if (entry.count >= 5 && errorRate > DEFAULT_ERROR_RATE_THRESHOLD) {
            return {
              rule: 'high-error-rate',
              severity: 'critical',
              message: `Route ${entry.method} ${entry.path} has ${Math.round(errorRate * 100)}% error rate`,
              triggeredAt: new Date(),
            };
          }
        }
        return null;
      },
    },
    {
      name: 'high-latency',
      description: `Fires when any route avg latency exceeds ${DEFAULT_HIGH_LATENCY_MS}ms`,
      severity: 'warning',
      check(store) {
        const entries = store.getAll();
        for (const entry of entries) {
          const avg = entry.totalDuration / (entry.count || 1);
          if (entry.count >= 3 && avg > DEFAULT_HIGH_LATENCY_MS) {
            return {
              rule: 'high-latency',
              severity: 'warning',
              message: `Route ${entry.method} ${entry.path} avg latency is ${Math.round(avg)}ms`,
              triggeredAt: new Date(),
            };
          }
        }
        return null;
      },
    },
    {
      name: 'high-volume',
      description: `Fires when total requests per minute exceed ${DEFAULT_HIGH_VOLUME_RPM}`,
      severity: 'info',
      check(store) {
        const rpm = store.getRequestsPerMinute();
        if (rpm > DEFAULT_HIGH_VOLUME_RPM) {
          return {
            rule: 'high-volume',
            severity: 'info',
            message: `Traffic spike detected: ${rpm.toFixed(1)} requests/min`,
            triggeredAt: new Date(),
          };
        }
        return null;
      },
    },
  ];
}

export class AlertManager {
  private rules: AlertRule[];
  private store: RouteStore;

  constructor(store: RouteStore, rules?: AlertRule[]) {
    this.store = store;
    this.rules = rules ?? createDefaultRules();
  }

  evaluate(): AlertResult[] {
    const results: AlertResult[] = [];
    for (const rule of this.rules) {
      const result = rule.check(this.store);
      if (result) results.push(result);
    }
    return results;
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
}
