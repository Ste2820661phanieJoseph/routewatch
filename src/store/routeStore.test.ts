import { RouteStore } from './routeStore';
import { RouteEntry } from '../middleware/routewatch';

function makeEntry(overrides: Partial<RouteEntry> = {}): RouteEntry {
  return {
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    responseTimeMs: 42,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('RouteStore', () => {
  beforeEach(() => {
    RouteStore.reset();
  });

  it('should return a singleton instance', () => {
    const a = RouteStore.getInstance();
    const b = RouteStore.getInstance();
    expect(a).toBe(b);
  });

  it('should record a new route entry', () => {
    const store = RouteStore.getInstance();
    store.record(makeEntry());
    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].hits).toBe(1);
    expect(all[0].method).toBe('GET');
    expect(all[0].path).toBe('/api/users');
  });

  it('should accumulate hits and compute average response time', () => {
    const store = RouteStore.getInstance();
    store.record(makeEntry({ responseTimeMs: 100 }));
    store.record(makeEntry({ responseTimeMs: 200 }));
    const stat = store.getByKey('GET', '/api/users')!;
    expect(stat.hits).toBe(2);
    expect(stat.avgResponseTimeMs).toBe(150);
    expect(stat.minResponseTimeMs).toBe(100);
    expect(stat.maxResponseTimeMs).toBe(200);
  });

  it('should track last status code and timestamp', () => {
    const store = RouteStore.getInstance();
    const ts = new Date();
    store.record(makeEntry({ statusCode: 404, timestamp: ts }));
    const stat = store.getByKey('GET', '/api/users')!;
    expect(stat.lastStatusCode).toBe(404);
    expect(stat.lastCalledAt).toEqual(ts);
  });

  it('should sort results by hits descending', () => {
    const store = RouteStore.getInstance();
    store.record(makeEntry({ path: '/a' }));
    store.record(makeEntry({ path: '/b' }));
    store.record(makeEntry({ path: '/b' }));
    const all = store.getAll();
    expect(all[0].path).toBe('/b');
    expect(all[1].path).toBe('/a');
  });

  it('should not exceed maxRoutes capacity', () => {
    const store = RouteStore.getInstance(2);
    store.record(makeEntry({ path: '/one' }));
    store.record(makeEntry({ path: '/two' }));
    store.record(makeEntry({ path: '/three' })); // should be dropped
    expect(store.getAll()).toHaveLength(2);
  });

  it('should clear all stats', () => {
    const store = RouteStore.getInstance();
    store.record(makeEntry());
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });
});
