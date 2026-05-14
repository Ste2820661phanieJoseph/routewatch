import request from 'supertest';
import express from 'express';
import { createDashboard } from './dashboard';
import * as routeStore from '../store/routeStore';
import { RouteEntry } from '../store/routeStore';

const mockEntry: RouteEntry = {
  method: 'GET',
  path: '/api/users',
  count: 5,
  lastSeen: new Date('2024-01-01T12:00:00Z'),
  avgResponseTime: 42,
  statusCodes: { 200: 5 },
};

describe('createDashboard', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    jest.spyOn(routeStore, 'getStore').mockReturnValue({
      'GET /api/users': mockEntry,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mounts on the default path /__routewatch', async () => {
    app.use(createDashboard());
    const res = await request(app).get('/__routewatch');
    expect(res.status).toBe(200);
  });

  it('mounts on a custom path when provided', async () => {
    app.use(createDashboard({ path: '/metrics' }));
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
  });

  it('returns HTML by default (table format)', async () => {
    app.use(createDashboard());
    const res = await request(app).get('/__routewatch');
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('RouteWatch Dashboard');
    expect(res.text).toContain('<pre>');
  });

  it('returns JSON when format is json', async () => {
    app.use(createDashboard({ format: 'json' }));
    const res = await request(app).get('/__routewatch');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title', 'RouteWatch Dashboard');
    expect(res.body).toHaveProperty('data');
  });

  it('returns raw JSON on the /json sub-route', async () => {
    app.use(createDashboard());
    const res = await request(app).get('/__routewatch/json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns empty state message when no routes recorded', async () => {
    jest.spyOn(routeStore, 'getStore').mockReturnValue({});
    app.use(createDashboard({ format: 'json' }));
    const res = await request(app).get('/__routewatch');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/no routes/i);
    expect(res.body.routes).toEqual([]);
  });

  it('uses a custom title when provided', async () => {
    app.use(createDashboard({ title: 'My API Monitor' }));
    const res = await request(app).get('/__routewatch');
    expect(res.text).toContain('My API Monitor');
  });
});
