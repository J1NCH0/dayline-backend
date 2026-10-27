import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DEFAULT_THROTTLE_LIMIT } from '../../src/throttling/constants/default-throttle-limit.constant.js';
import { createTestApp } from '../support/create-test-app.js';
import { ProbeController } from '../support/fixtures/probe.controller.js';

describe('global response format (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeController] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps successful responses in { status, data }', async () => {
    const response = await request(app.getHttpServer())
      .post('/test-probe/echo')
      .send({ name: 'dayline' });

    expect(response.body).toEqual({
      status: 201,
      data: { name: 'dayline', isDto: true },
    });
  });

  it('sends no body for 204 responses', async () => {
    const response = await request(app.getHttpServer()).delete(
      '/test-probe/nothing',
    );

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('formats validation errors as { status: 400, errors: { field: [...] } }', async () => {
    const response = await request(app.getHttpServer())
      .post('/test-probe/echo')
      .send({ name: 'a-name-that-is-way-too-long' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      errors: {
        name: ['name must be shorter than or equal to 20 characters'],
      },
    });
  });

  it('supports field errors with another status, e.g. 409', async () => {
    const response = await request(app.getHttpServer()).get(
      '/test-probe/field-conflict',
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      errors: { email: ['Email is already registered'] },
    });
  });

  it('formats unknown routes as { status: 404, error }', async () => {
    const response = await request(app.getHttpServer()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      error: 'Cannot GET /does-not-exist',
    });
  });

  it('maps a Prisma unique violation to a generic 409', async () => {
    const response = await request(app.getHttpServer()).get(
      '/test-probe/unique-conflict',
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      error: 'Resource already exists',
    });
  });

  it('hides internal error details behind a generic 500', async () => {
    const response = await request(app.getHttpServer()).get('/test-probe/crash');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 500,
      error: 'Internal server error',
    });
    expect(response.text).not.toContain('secret internal detail');
  });

  it('formats rate limiting as { status: 429, error }', async () => {
    const server = app.getHttpServer();
    let limited = await request(server).get('/test-probe/ip');
    for (let i = 0; i < DEFAULT_THROTTLE_LIMIT && limited.status !== 429; i++) {
      limited = await request(server).get('/test-probe/ip');
    }

    expect(limited.status).toBe(429);
    expect(limited.body.status).toBe(429);
    expect(typeof limited.body.error).toBe('string');
    expect(limited.headers['retry-after']).toBeDefined();
  });
});
