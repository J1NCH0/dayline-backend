import { describe, expect, it } from 'bun:test';
import type { User } from '../../../../src/generated/prisma/client.js';
import { UserMapper } from '../../../../src/users/mappers/user.mapper.js';

const user: User = {
  id: 7,
  email: 'david@example.com',
  passwordHash: '$argon2id$v=19$secret',
  createdAt: new Date('2026-10-27T08:30:00.000Z'),
  updatedAt: new Date('2026-10-28T09:00:00.000Z'),
};

describe('UserMapper.toResponse', () => {
  it('maps the public fields with an ISO createdAt', () => {
    expect(UserMapper.toResponse(user)).toEqual({
      id: 7,
      email: 'david@example.com',
      createdAt: '2026-10-27T08:30:00.000Z',
    });
  });

  it('never exposes the password hash', () => {
    const response = UserMapper.toResponse(user);

    expect(response).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response)).not.toContain('argon2id');
  });
});
