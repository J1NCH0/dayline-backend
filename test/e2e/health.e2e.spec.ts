import { afterEach, describe, expect, it } from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthRepository } from '../../src/health/repositories/health.repository.js';
import { createTestApp } from '../support/create-test-app.js';

describe('GET /health (e2e)', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 ok/up against the real test database', async () => {
    app = await createTestApp();

    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 200,
      data: { status: 'ok', database: 'up' },
    });
  });

  it('returns 503 when the database ping fails', async () => {
    app = await createTestApp({
      customize: (builder) =>
        builder.overrideProvider(HealthRepository).useValue({
          pingDatabase: () => Promise.reject(new Error('connection refused')),
        }),
    });

    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 503,
      error: 'Database unavailable',
    });
  });
});
