import { createRateLimitDetector } from './rateLimitDetector';
import { createRouteStore } from '../store/routeStore';

function makeStore(entries: Array<{ method: string; route: string; status: number; durationMs: number; timestamp?: Date }>) {
  const store = createRouteStore();
  for (const e of entries) {
    store.record({
      method: e.method,
      route: e.route,
      status: e.status,
      durationMs: e.durationMs,
      timestamp: e.timestamp ?? new Date(),
    });
  }
  return store;
}

describe('createRateLimitDetector', () => {
  it('returns no violations when traffic is within limits', () => {
    const store = makeStore([
      { method: 'GET', route: '/api/users', status: 200, durationMs: 10 },
      { method: 'GET', route: '/api/users', status: 200, durationMs: 12 },
    ]);
    const detector = createRateLimitDetector([{ windowMs: 60_000, maxRequests: 50 }]);
    const violations = detector.check(store);
    expect(violations).toHaveLength(0);
  });

  it('detects violations when requests exceed the limit', () => {
    const entries = Array.from({ length: 5 }, () => ({
      method: 'POST',
      route: '/api/login',
      status: 200,
      durationMs: 5,
    }));
    const store = makeStore(entries);
    const detector = createRateLimitDetector([{ windowMs: 60_000, maxRequests: 3 }]);
    const violations = detector.check(store);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].route).toBe('/api/login');
    expect(violations[0].requestCount).toBe(5);
  });

  it('respects routePattern filter', () => {
    const store = makeStore([
      ...Array.from({ length: 5 }, () => ({ method: 'GET', route: '/api/items', status: 200, durationMs: 8 })),
      ...Array.from({ length: 5 }, () => ({ method: 'GET', route: '/health', status: 200, durationMs: 2 })),
    ]);
    const detector = createRateLimitDetector([
      { windowMs: 60_000, maxRequests: 3, routePattern: '/api' },
    ]);
    const violations = detector.check(store);
    expect(violations.every((v) => v.route.includes('/api'))).toBe(true);
  });

  it('ignores entries outside the time window', () => {
    const oldTimestamp = new Date(Date.now() - 120_000);
    const store = makeStore(
      Array.from({ length: 5 }, () => ({
        method: 'GET',
        route: '/api/data',
        status: 200,
        durationMs: 10,
        timestamp: oldTimestamp,
      }))
    );
    const detector = createRateLimitDetector([{ windowMs: 60_000, maxRequests: 3 }]);
    const violations = detector.check(store);
    expect(violations).toHaveLength(0);
  });

  it('addRule and getRules work correctly', () => {
    const detector = createRateLimitDetector();
    detector.addRule({ windowMs: 5_000, maxRequests: 10 });
    const rules = detector.getRules();
    expect(rules.length).toBe(2);
    expect(rules[1].windowMs).toBe(5_000);
  });
});
