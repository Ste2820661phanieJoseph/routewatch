import { createHealthCheckDetector, HealthCheckRule } from './healthCheckDetector';
import { RouteStore } from '../store/routeStore';

function makeStore(overrides: Partial<ReturnType<RouteStore['getAll']>[0]>[] = []): RouteStore {
  const entries = overrides.map((o) => ({
    method: 'GET',
    path: '/api/test',
    count: 10,
    avgDuration: 50,
    statusCodes: { 200: 10 },
    ...o,
  }));
  return {
    getAll: () => entries,
    record: () => {},
    reset: () => {},
  } as unknown as RouteStore;
}

describe('createHealthCheckDetector', () => {
  it('returns no results when all routes are healthy', () => {
    const store = makeStore([{ path: '/api/data', avgDuration: 50, statusCodes: { 200: 10 } }]);
    const detector = createHealthCheckDetector(store);
    // Remove default low-success-rate rule triggering on 100% healthy routes
    const results = detector.check();
    const unhealthy = results.filter((r) => r.status !== 'healthy');
    expect(unhealthy.length).toBe(0);
  });

  it('detects degraded health endpoint with high response time', () => {
    const store = makeStore([{ path: '/health', avgDuration: 350, statusCodes: { 200: 10 } }]);
    const detector = createHealthCheckDetector(store);
    const results = detector.check();
    const hit = results.find((r) => r.rule === 'slow-health-endpoint');
    expect(hit).toBeDefined();
    expect(['degraded', 'unhealthy']).toContain(hit!.status);
  });

  it('detects unhealthy route with very high response time', () => {
    const store = makeStore([{ path: '/health', avgDuration: 600, statusCodes: { 200: 10 } }]);
    const detector = createHealthCheckDetector(store);
    const results = detector.check();
    const hit = results.find((r) => r.rule === 'slow-health-endpoint');
    expect(hit?.status).toBe('unhealthy');
  });

  it('detects low success rate', () => {
    const store = makeStore([{ path: '/api/flaky', avgDuration: 30, statusCodes: { 200: 5, 500: 5 } }]);
    const detector = createHealthCheckDetector(store);
    const results = detector.check();
    const hit = results.find((r) => r.rule === 'low-success-rate');
    expect(hit).toBeDefined();
    expect(hit!.successRate).toBeCloseTo(0.5);
  });

  it('supports custom rules via addRule', () => {
    const store = makeStore([{ path: '/api/custom', avgDuration: 800, statusCodes: { 200: 10 } }]);
    const detector = createHealthCheckDetector(store);
    const rule: HealthCheckRule = { name: 'custom-slow', routePattern: /\/api\/custom/, maxResponseTime: 100 };
    detector.addRule(rule);
    const results = detector.check();
    const hit = results.find((r) => r.rule === 'custom-slow');
    expect(hit).toBeDefined();
  });

  it('getRules returns all rules including defaults', () => {
    const store = makeStore();
    const detector = createHealthCheckDetector(store);
    expect(detector.getRules().length).toBeGreaterThanOrEqual(2);
  });
});
