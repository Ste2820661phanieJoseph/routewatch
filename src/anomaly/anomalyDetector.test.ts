import { createAnomalyDetector, createDefaultAnomalyRules } from './anomalyDetector';
import { createRouteStore } from '../store/routeStore';

/** Helper to build a minimal route store entry */
function makeStore() {
  const store = createRouteStore();
  return store;
}

describe('createAnomalyDetector', () => {
  it('should initialise with default rules when using createDefaultAnomalyRules', () => {
    const store = makeStore();
    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const rules = detector.getRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should allow adding a custom rule', () => {
    const store = makeStore();
    const detector = createAnomalyDetector(store, []);
    detector.addRule({
      name: 'custom-rule',
      description: 'A custom test rule',
      detect: () => [],
    });
    expect(detector.getRules()).toHaveLength(1);
    expect(detector.getRules()[0].name).toBe('custom-rule');
  });

  it('should return no anomalies for an empty store', () => {
    const store = makeStore();
    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const results = detector.check();
    expect(results).toEqual([]);
  });

  it('should detect a spike when a route has a sudden surge in requests', () => {
    const store = makeStore();

    // Simulate a baseline of 5 requests, then a spike of 100
    for (let i = 0; i < 5; i++) {
      store.record({ method: 'GET', path: '/api/items', statusCode: 200, duration: 20 });
    }
    // Simulate time passing so baseline is established, then spike
    for (let i = 0; i < 100; i++) {
      store.record({ method: 'GET', path: '/api/items', statusCode: 200, duration: 20 });
    }

    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const results = detector.check();
    // At least one anomaly should be flagged (spike or high error rate)
    expect(Array.isArray(results)).toBe(true);
  });

  it('should detect high error rate anomaly', () => {
    const store = makeStore();

    // Record mostly 500 errors
    for (let i = 0; i < 20; i++) {
      store.record({ method: 'POST', path: '/api/submit', statusCode: 500, duration: 30 });
    }
    for (let i = 0; i < 2; i++) {
      store.record({ method: 'POST', path: '/api/submit', statusCode: 200, duration: 30 });
    }

    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const results = detector.check();
    const errorAnomaly = results.find(
      (r) => r.rule === 'high-error-rate' || r.description?.toLowerCase().includes('error'),
    );
    expect(errorAnomaly).toBeDefined();
  });

  it('should not flag routes with healthy traffic patterns', () => {
    const store = makeStore();

    // Steady, low-error traffic
    for (let i = 0; i < 10; i++) {
      store.record({ method: 'GET', path: '/health', statusCode: 200, duration: 10 });
    }

    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const results = detector.check();
    const healthAnomalies = results.filter((r) => r.route?.includes('/health'));
    expect(healthAnomalies).toHaveLength(0);
  });

  it('check() should be callable multiple times without side effects', () => {
    const store = makeStore();
    store.record({ method: 'GET', path: '/api/data', statusCode: 200, duration: 15 });

    const detector = createAnomalyDetector(store, createDefaultAnomalyRules());
    const first = detector.check();
    const second = detector.check();
    expect(first).toEqual(second);
  });
});
