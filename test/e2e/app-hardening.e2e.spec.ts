import { afterEach, describe, expect, it } from 'bun:test';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppConfigService } from '../../src/config/services/app-config.service.js';
import { DEFAULT_THROTTLE_LIMIT } from '../../src/throttling/constants/default-throttle-limit.constant.js';
import { createTestApp } from '../support/create-test-app.js';
import { ProbeController } from '../support/fixtures/probe.controller.js';
import { TrustingProxyConfigService } from '../support/fixtures/trusting-proxy-config.service.js';

describe('app hardening (e2e)', () => {
  let app: NestExpressApplication;

  afterEach(async () => {
    await app.close();
  });

  describe('security headers', () => {
    it('sets helmet headers and hides x-powered-by', async () => {
      app = await createTestApp();

      const response = await request(app.getHttpServer()).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toContain(
        'max-age=',
      );
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('request validation', () => {
    it('accepts a valid body and transforms it into the DTO class', async () => {
      app = await createTestApp({ controllers: [ProbeController] });

      const response = await request(app.getHttpServer())
        .post('/test-probe/echo')
        .send({ name: 'dayline' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        status: 201,
        data: { name: 'dayline', isDto: true },
      });
    });

    it('rejects unknown fields with 400', async () => {
      app = await createTestApp({ controllers: [ProbeController] });

      const response = await request(app.getHttpServer())
        .post('/test-probe/echo')
        .send({ name: 'dayline', isAdmin: true });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        status: 400,
        errors: { isAdmin: ['property isAdmin should not exist'] },
      });
    });

    it('rejects a wrong type with 400', async () => {
      app = await createTestApp({ controllers: [ProbeController] });

      const response = await request(app.getHttpServer())
        .post('/test-probe/echo')
        .send({ name: 42 });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(400);
      expect(response.body.errors.name).toContain('name must be a string');
    });

    it('rejects a missing field with 400', async () => {
      app = await createTestApp({ controllers: [ProbeController] });

      const response = await request(app.getHttpServer())
        .post('/test-probe/echo')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('trust proxy', () => {
    it('ignores X-Forwarded-For when TRUST_PROXY=0', async () => {
      app = await createTestApp({ controllers: [ProbeController] });

      const response = await request(app.getHttpServer())
        .get('/test-probe/ip')
        .set('X-Forwarded-For', '203.0.113.7');

      expect(response.body.data.ip).not.toBe('203.0.113.7');
    });

    it('uses X-Forwarded-For as the client IP when TRUST_PROXY=1', async () => {
      app = await createTestApp({
        controllers: [ProbeController],
        customize: (builder) =>
          builder
            .overrideProvider(AppConfigService)
            .useClass(TrustingProxyConfigService),
      });

      const response = await request(app.getHttpServer())
        .get('/test-probe/ip')
        .set('X-Forwarded-For', '203.0.113.7');

      expect(response.body.data.ip).toBe('203.0.113.7');
    });
  });

  describe('rate limiting', () => {
    it(`returns 429 after ${DEFAULT_THROTTLE_LIMIT} requests per minute`, async () => {
      app = await createTestApp({ controllers: [ProbeController] });
      const server = app.getHttpServer();

      for (let i = 0; i < DEFAULT_THROTTLE_LIMIT; i++) {
        const ok = await request(server).get('/test-probe/ip');
        expect(ok.status).toBe(200);
      }
      const limited = await request(server).get('/test-probe/ip');

      expect(limited.status).toBe(429);
      expect(limited.headers['retry-after']).toBeDefined();
    });

    it('never throttles /health', async () => {
      app = await createTestApp();
      const server = app.getHttpServer();

      for (let i = 0; i <= DEFAULT_THROTTLE_LIMIT; i++) {
        const response = await request(server).get('/health');
        expect(response.status).toBe(200);
      }
    });
  });
});
