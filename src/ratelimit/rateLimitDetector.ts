import { RouteStore } from '../store/routeStore';

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  routePattern?: string;
}

export interface RateLimitViolation {
  route: string;
  method: string;
  requestCount: number;
  windowMs: number;
  maxRequests: number;
  detectedAt: Date;
}

export interface RateLimitDetector {
  check(store: RouteStore): RateLimitViolation[];
  addRule(rule: RateLimitRule): void;
  getRules(): RateLimitRule[];
}

export function createRateLimitDetector(
  initialRules: RateLimitRule[] = []
): RateLimitDetector {
  const rules: RateLimitRule[] = [
    { windowMs: 60_000, maxRequests: 100 },
    ...initialRules,
  ];

  function check(store: RouteStore): RateLimitViolation[] {
    const violations: RateLimitViolation[] = [];
    const entries = store.getAll();
    const now = Date.now();

    for (const rule of rules) {
      const windowStart = now - rule.windowMs;

      const relevant = entries.filter((e) => {
        const matchesPattern =
          !rule.routePattern || e.route.includes(rule.routePattern);
        const withinWindow = new Date(e.timestamp).getTime() >= windowStart;
        return matchesPattern && withinWindow;
      });

      const grouped = new Map<string, number>();
      for (const e of relevant) {
        const key = `${e.method}:${e.route}`;
        grouped.set(key, (grouped.get(key) ?? 0) + 1);
      }

      for (const [key, count] of grouped.entries()) {
        if (count > rule.maxRequests) {
          const [method, ...routeParts] = key.split(':');
          violations.push({
            route: routeParts.join(':'),
            method,
            requestCount: count,
            windowMs: rule.windowMs,
            maxRequests: rule.maxRequests,
            detectedAt: new Date(),
          });
        }
      }
    }

    return violations;
  }

  function addRule(rule: RateLimitRule): void {
    rules.push(rule);
  }

  function getRules(): RateLimitRule[] {
    return [...rules];
  }

  return { check, addRule, getRules };
}
