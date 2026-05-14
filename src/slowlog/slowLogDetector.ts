import { RouteStore } from '../store/routeStore';

export interface SlowLogRule {
  thresholdMs: number;
  label: string;
}

export interface SlowLogViolation {
  method: string;
  path: string;
  avgResponseMs: number;
  maxResponseMs: number;
  callCount: number;
  rule: SlowLogRule;
}

export interface SlowLogDetector {
  check: (store: RouteStore) => SlowLogViolation[];
  addRule: (rule: SlowLogRule) => void;
  getRules: () => SlowLogRule[];
}

const DEFAULT_RULES: SlowLogRule[] = [
  { thresholdMs: 1000, label: 'slow' },
  { thresholdMs: 3000, label: 'very slow' },
];

export function createSlowLogDetector(initialRules?: SlowLogRule[]): SlowLogDetector {
  const rules: SlowLogRule[] = initialRules ? [...initialRules] : [...DEFAULT_RULES];

  function check(store: RouteStore): SlowLogViolation[] {
    const violations: SlowLogViolation[] = [];
    const entries = store.getAll();

    for (const entry of entries) {
      if (!entry.responseTimes || entry.responseTimes.length === 0) continue;

      const avg =
        entry.responseTimes.reduce((sum, t) => sum + t, 0) / entry.responseTimes.length;
      const max = Math.max(...entry.responseTimes);

      for (const rule of rules) {
        if (avg >= rule.thresholdMs) {
          violations.push({
            method: entry.method,
            path: entry.path,
            avgResponseMs: Math.round(avg),
            maxResponseMs: Math.round(max),
            callCount: entry.count,
            rule,
          });
          break; // apply the first matching (most severe) rule only
        }
      }
    }

    return violations;
  }

  function addRule(rule: SlowLogRule): void {
    rules.push(rule);
    rules.sort((a, b) => b.thresholdMs - a.thresholdMs);
  }

  function getRules(): SlowLogRule[] {
    return [...rules];
  }

  return { check, addRule, getRules };
}
