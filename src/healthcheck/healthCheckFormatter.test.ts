import {
  formatHealthCheckResults,
  formatHealthCheckResultsJson,
  healthCheckResultsToHtml,
} from './healthCheckFormatter';
import { HealthCheckResult } from './healthCheckDetector';

const mockResults: HealthCheckResult[] = [
  {
    rule: 'slow-health-endpoint',
    route: 'GET /health',
    status: 'degraded',
    avgResponseTime: 350,
    successRate: 1,
    totalRequests: 20,
    message: 'avg response time 350.0ms exceeds 200ms',
  },
  {
    rule: 'low-success-rate',
    route: 'GET /api/flaky',
    status: 'unhealthy',
    avgResponseTime: 40,
    successRate: 0.5,
    totalRequests: 10,
    message: 'success rate 50.0% below 95.0%',
  },
];

describe('formatHealthCheckResults', () => {
  it('returns healthy message when no results', () => {
    expect(formatHealthCheckResults([])).toBe('All routes are healthy.');
  });

  it('includes route and status in output', () => {
    const output = formatHealthCheckResults(mockResults);
    expect(output).toContain('GET /health');
    expect(output).toContain('DEGRADED');
    expect(output).toContain('GET /api/flaky');
    expect(output).toContain('UNHEALTHY');
  });

  it('includes avg response time and success rate', () => {
    const output = formatHealthCheckResults(mockResults);
    expect(output).toContain('350.0ms');
    expect(output).toContain('50.0%');
  });
});

describe('formatHealthCheckResultsJson', () => {
  it('returns valid JSON', () => {
    const json = formatHealthCheckResultsJson(mockResults);
    const parsed = JSON.parse(json);
    expect(parsed.results).toHaveLength(2);
    expect(parsed.timestamp).toBeDefined();
  });

  it('includes route status in JSON', () => {
    const parsed = JSON.parse(formatHealthCheckResultsJson(mockResults));
    expect(parsed.results[0].status).toBe('degraded');
  });
});

describe('healthCheckResultsToHtml', () => {
  it('returns healthy paragraph when no results', () => {
    expect(healthCheckResultsToHtml([])).toContain('healthy');
  });

  it('renders a table with results', () => {
    const html = healthCheckResultsToHtml(mockResults);
    expect(html).toContain('<table');
    expect(html).toContain('GET /health');
    expect(html).toContain('degraded');
  });

  it('escapes HTML in route names', () => {
    const dangerous: HealthCheckResult[] = [
      { ...mockResults[0], route: '<script>alert(1)</script>' },
    ];
    const html = healthCheckResultsToHtml(dangerous);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
