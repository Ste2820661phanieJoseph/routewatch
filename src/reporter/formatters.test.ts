import { formatTable, formatJson, formatSummary, RouteStats } from './formatters';

const makeStats = (overrides: Partial<RouteStats> = {}): RouteStats => ({
  method: 'GET',
  path: '/api/test',
  count: 10,
  avgDurationMs: 42.5,
  lastCalledAt: new Date('2024-01-15T12:00:00.000Z'),
  errorRate: 0.1,
  ...overrides,
});

describe('formatTable', () => {
  it('returns empty message when no stats provided', () => {
    expect(formatTable([])).toBe('No routes recorded yet.\n');
  });

  it('includes method and path in output', () => {
    const result = formatTable([makeStats()]);
    expect(result).toContain('GET');
    expect(result).toContain('/api/test');
  });

  it('includes count and avg duration', () => {
    const result = formatTable([makeStats({ count: 99, avgDurationMs: 123.45 })]);
    expect(result).toContain('99');
    expect(result).toContain('123.45');
  });

  it('truncates long paths to 40 characters', () => {
    const longPath = '/api/' + 'a'.repeat(60);
    const result = formatTable([makeStats({ path: longPath })]);
    expect(result).toContain('/api/' + 'a'.repeat(35));
  });

  it('shows "never" when lastCalledAt is null', () => {
    const result = formatTable([makeStats({ lastCalledAt: null })]);
    expect(result).toContain('never');
  });
});

describe('formatJson', () => {
  it('returns valid JSON string', () => {
    const stats = [makeStats()];
    expect(() => JSON.parse(formatJson(stats))).not.toThrow();
  });

  it('contains all route fields', () => {
    const parsed = JSON.parse(formatJson([makeStats()]));
    expect(parsed[0]).toMatchObject({ method: 'GET', path: '/api/test', count: 10 });
  });
});

describe('formatSummary', () => {
  it('shows total request count', () => {
    const stats = [makeStats({ count: 5 }), makeStats({ path: '/other', count: 3 })];
    expect(formatSummary(stats)).toContain('Total requests : 8');
  });

  it('shows unique route count', () => {
    const stats = [makeStats(), makeStats({ path: '/other' })];
    expect(formatSummary(stats)).toContain('Unique routes  : 2');
  });

  it('shows top route', () => {
    const stats = [makeStats({ count: 50 }), makeStats({ path: '/low', count: 2 })];
    expect(formatSummary(stats)).toContain('GET /api/test (50 hits)');
  });

  it('handles empty stats gracefully', () => {
    expect(formatSummary([])).toContain('N/A');
  });
});
