import { AlertManager, createDefaultRules, AlertResult } from './alertManager';
import { RouteStore } from '../store/routeStore';

function makeStore(overrides: Partial<ReturnType<RouteStore['getAll']>[number]>[] = []): RouteStore {
  const store = new RouteStore();
  jest.spyOn(store, 'getAll').mockReturnValue(
    overrides.map((o) => ({
      method: 'GET',
      path: '/test',
      count: 10,
      errorCount: 0,
      totalDuration: 1000,
      lastCalledAt: new Date(),
      statusCodes: { 200: 10 },
      ...o,
    }))
  );
  jest.spyOn(store, 'getRequestsPerMinute').mockReturnValue(0);
  return store;
}

describe('AlertManager', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns no alerts when everything is healthy', () => {
    const store = makeStore([{ count: 10, errorCount: 0, totalDuration: 500 }]);
    const manager = new AlertManager(store);
    expect(manager.evaluate()).toHaveLength(0);
  });

  it('triggers high-error-rate alert', () => {
    const store = makeStore([{ count: 10, errorCount: 8 }]);
    const manager = new AlertManager(store);
    const alerts = manager.evaluate();
    const alert = alerts.find((a) => a.rule === 'high-error-rate');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('critical');
  });

  it('does not trigger high-error-rate for low sample size', () => {
    const store = makeStore([{ count: 2, errorCount: 2 }]);
    const manager = new AlertManager(store);
    const alerts = manager.evaluate();
    expect(alerts.find((a) => a.rule === 'high-error-rate')).toBeUndefined();
  });

  it('triggers high-latency alert', () => {
    const store = makeStore([{ count: 5, totalDuration: 15000 }]);
    const manager = new AlertManager(store);
    const alerts = manager.evaluate();
    const alert = alerts.find((a) => a.rule === 'high-latency');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('warning');
    expect(alert!.message).toContain('3000ms');
  });

  it('triggers high-volume alert', () => {
    const store = makeStore([]);
    jest.spyOn(store, 'getRequestsPerMinute').mockReturnValue(150);
    const manager = new AlertManager(store);
    const alerts = manager.evaluate();
    const alert = alerts.find((a) => a.rule === 'high-volume');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('info');
  });

  it('supports adding custom rules', () => {
    const store = makeStore([{ count: 1 }]);
    const manager = new AlertManager(store, []);
    manager.addRule({
      name: 'custom',
      description: 'always fires',
      severity: 'info',
      check: () => ({ rule: 'custom', severity: 'info', message: 'custom alert', triggeredAt: new Date() }),
    });
    const alerts = manager.evaluate();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].rule).toBe('custom');
  });

  it('createDefaultRules returns three rules', () => {
    expect(createDefaultRules()).toHaveLength(3);
  });
});
