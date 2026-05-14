import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportRouteData } from './exporter';
import { createRouteStore } from '../store/routeStore';

function makeStore() {
  const store = createRouteStore();
  store.record({ method: 'GET', path: '/api/users', durationMs: 42, statusCode: 200 });
  store.record({ method: 'GET', path: '/api/users', durationMs: 58, statusCode: 200 });
  store.record({ method: 'POST', path: '/api/items', durationMs: 120, statusCode: 201 });
  return store;
}

describe('exportRouteData', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exports JSON and writes a valid file', () => {
    const store = makeStore();
    const outPath = exportRouteData(store, { format: 'json', outputDir: tmpDir, filename: 'out.json' });
    expect(fs.existsSync(outPath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('exports CSV with correct header and rows', () => {
    const store = makeStore();
    const outPath = exportRouteData(store, { format: 'csv', outputDir: tmpDir, filename: 'out.csv' });
    const lines = fs.readFileSync(outPath, 'utf-8').split('\n');
    expect(lines[0]).toBe('method,path,count,avgDurationMs,lastCalledAt');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('exports table format as text file', () => {
    const store = makeStore();
    const outPath = exportRouteData(store, { format: 'table', outputDir: tmpDir, filename: 'out.txt' });
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('GET');
    expect(content).toContain('/api/users');
  });

  it('auto-generates filename when not provided', () => {
    const store = makeStore();
    const outPath = exportRouteData(store, { format: 'json', outputDir: tmpDir });
    expect(path.basename(outPath)).toMatch(/^routewatch-export-\d+\.json$/);
    expect(fs.existsSync(outPath)).toBe(true);
  });

  it('creates outputDir if it does not exist', () => {
    const store = makeStore();
    const nested = path.join(tmpDir, 'deep', 'nested');
    const outPath = exportRouteData(store, { format: 'csv', outputDir: nested, filename: 'data.csv' });
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
