import { generateReport } from './reporter';
import { getRouteStore } from '../store/routeStore';

const makeEntry = (overrides = {}) => ({
  method: 'GET',
  path: '/api/items',
  statusCode: 200,
  durationMs: 30,
  timestamp: new Date(),
  ...overrides,
});

beforeEach(() => {
  getRouteStore().clear();
});

describe('generateReport', () => {
  it('returns empty message when store is empty (table format)', () => {
    const report = generateReport({ format: 'table' });
    expect(report).toBe('No routes recorded yet.\n');
  });

  it('returns valid JSON for json format', () => {
    getRouteStore().add(makeEntry());
    const report = generateReport({ format: 'json' });
    expect(() => JSON.parse(report)).not.toThrow();
  });

  it('aggregates multiple calls to the same route', () => {
    getRouteStore().add(makeEntry({ durationMs: 20 }));
    getRouteStore().add(makeEntry({ durationMs: 40 }));
    const parsed = JSON.parse(generateReport({ format: 'json' }));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].count).toBe(2);
    expect(parsed[0].avgDurationMs).toBeCloseTo(30);
  });

  it('calculates error rate correctly', () => {
    getRouteStore().add(makeEntry({ statusCode: 200 }));
    getRouteStore().add(makeEntry({ statusCode: 500 }));
    const parsed = JSON.parse(generateReport({ format: 'json' }));
    expect(parsed[0].errorRate).toBeCloseTo(0.5);
  });

  it('sorts routes by count descending', () => {
    getRouteStore().add(makeEntry({ path: '/low' }));
    getRouteStore().add(makeEntry({ path: '/high' }));
    getRouteStore().add(makeEntry({ path: '/high' }));
    const parsed = JSON.parse(generateReport({ format: 'json' }));
    expect(parsed[0].path).toBe('/high');
  });

  it('defaults to table format', () => {
    getRouteStore().add(makeEntry());
    const report = generateReport();
    expect(report).toContain('GET');
    expect(report).toContain('/api/items');
  });

  it('summary format includes total requests', () => {
    getRouteStore().add(makeEntry());
    getRouteStore().add(makeEntry({ path: '/other' }));
    const report = generateReport({ format: 'summary' });
    expect(report).toContain('Total requests : 2');
  });
});
