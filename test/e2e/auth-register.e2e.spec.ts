import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/services/prisma.service.js';
import { createTestApp } from '../support/create-test-app.js';
import { resetDatabase } from '../support/reset-database.js';

const validPassword = 'correct horse battery staple';

describe('POST /auth/register (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const register = (body: object) =>
    request(app.getHttpServer()).post('/auth/register').send(body);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates the user and returns 201 with the public user', async () => {
    const response = await register({
      email: 'david@example.com',
      password: validPassword,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      status: 201,
      data: {
        id: 1,
        email: 'david@example.com',
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      },
    });
    expect(response.text).not.toContain('passwordHash');
    expect(response.text).not.toContain(validPassword);
  });

  it('stores an argon2id hash, never the plain password', async () => {
    await register({ email: 'david@example.com', password: validPassword });

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'david@example.com' },
    });
    expect(user.passwordHash).toStartWith('$argon2id$');
    expect(user.passwordHash).not.toContain(validPassword);
    expect(await Bun.password.verify(validPassword, user.passwordHash)).toBe(
      true,
    );
  });

  it('trims and lowercases the email', async () => {
    const response = await register({
      email: '  David@Example.COM ',
      password: validPassword,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('david@example.com');
  });

  it('returns 409 with a field error for an already registered email', async () => {
    await register({ email: 'david@example.com', password: validPassword });

    const response = await register({
      email: 'DAVID@example.com',
      password: 'another long password',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      errors: { email: ['Email is already registered'] },
    });
    expect(await prisma.user.count()).toBe(1);
  });

  it('lets only one of two simultaneous registrations win', async () => {
    const body = { email: 'race@example.com', password: validPassword };

    const responses = await Promise.all([register(body), register(body)]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 409]);
    expect(await prisma.user.count()).toBe(1);
  });

  it('rejects an invalid email', async () => {
    const response = await register({
      email: 'not-an-email',
      password: validPassword,
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      errors: { email: ['email must be an email'] },
    });
  });

  it.each([
    [
      'too short (11 chars)',
      'a'.repeat(11),
      'password must be longer than or equal to 12 characters',
    ],
    [
      'too long (129 chars)',
      'a'.repeat(129),
      'password must be shorter than or equal to 128 characters',
    ],
  ])('rejects a password that is %s', async (_, password, message) => {
    const response = await register({ email: 'david@example.com', password });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 400,
      errors: { password: [message] },
    });
  });

  it.each([
    ['12 chars', 'a'.repeat(12)],
    ['128 chars', 'a'.repeat(128)],
  ])('accepts a password of exactly %s', async (_, password) => {
    const response = await register({ email: 'david@example.com', password });

    expect(response.status).toBe(201);
  });

  it('reports every missing field at once', async () => {
    const response = await register({});

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.errors).sort()).toEqual([
      'email',
      'password',
    ]);
  });

  it('refuses a client-supplied passwordHash', async () => {
    const response = await register({
      email: 'david@example.com',
      password: validPassword,
      passwordHash: '$argon2id$forged',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.passwordHash).toEqual([
      'property passwordHash should not exist',
    ]);
    expect(await prisma.user.count()).toBe(0);
  });
});
