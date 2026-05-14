import { createSlowLogDetector } from './slowLogDetector';
import { RouteStore } from '../store/routeStore';

function makeStore(entries: Array<{ method: string; path: string; count: number; responseTimes: number[] }>): RouteStore {
  const map = new Map();
  for (const e of entries) {
    map.set(`${e.method}:${e.path}`, { ...e });
  }
  return {
    getAll: () => Array.from(map.values()),
    record: jest.fn(),
    get: jest.fn(),
    clear: jest.fn(),
  } as unknown as RouteStore;
}

describe('createSlowLogDetector', () => {
  it('returns no violations when all routes are fast', () => {
    const detector = createSlowLogDetector();
    const store = makeStore([
      { method: 'GET', path: '/fast', count: 10, responseTimes: [50, 60, 55] },
    ]);
    expect(detector.check(store)).toHaveLength(0);
  });

  it('detects a slow route exceeding the threshold', () => {
    const detector = createSlowLogDetector();
    const store = makeStore([
      { method: 'GET', path: '/slow', count: 5, responseTimes: [1200, 1100, 1300] },
    ]);
    const violations = detector.check(store);
    expect(violations).toHaveLength(1);
    expect(violations[0].path).toBe('/slow');
    expect(violations[0].rule.label).toBe('slow');
  });

  it('labels a very slow route with the highest matching rule', () => {
    const detector = createSlowLogDetector();
    const store = makeStore([
      { method: 'POST', path: '/very-slow', count: 3, responseTimes: [3500, 4000, 3800] },
    ]);
    const violations = detector.check(store);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule.label).toBe('very slow');
  });

  it('skips entries with no response times', () => {
    const detector = createSlowLogDetector();
    const store = makeStore([
      { method: 'GET', path: '/no-times', count: 2, responseTimes: [] },
    ]);
    expect(detector.check(store)).toHaveLength(0);
  });

  it('addRule inserts and sorts rules by threshold descending', () => {
    const detector = createSlowLogDetector([]);
    detector.addRule({ thresholdMs: 500, label: 'medium' });
    detector.addRule({ thresholdMs: 2000, label: 'high' });
    const rules = detector.getRules();
    expect(rules[0].thresholdMs).toBeGreaterThanOrEqual(rules[1].thresholdMs);
  });

  it('getRules returns a copy, not the internal array', () => {
    const detector = createSlowLogDetector();
    const rules = detector.getRules();
    rules.push({ thresholdMs: 9999, label: 'injected' });
    expect(detector.getRules()).not.toContainEqual({ thresholdMs: 9999, label: 'injected' });
  });
});
