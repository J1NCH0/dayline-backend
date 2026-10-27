import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { User } from '../../../../src/generated/prisma/client.js';
import type { UsersRepository } from '../../../../src/users/repositories/users.repository.js';
import { UsersService } from '../../../../src/users/services/users.service.js';

const user: User = {
  id: 1,
  email: 'david@example.com',
  passwordHash: '$argon2id$hash',
  createdAt: new Date('2026-10-27T00:00:00.000Z'),
  updatedAt: new Date('2026-10-27T00:00:00.000Z'),
};

describe('UsersService', () => {
  let repository: {
    findById: ReturnType<typeof mock>;
    findByEmail: ReturnType<typeof mock>;
    create: ReturnType<typeof mock>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findById: mock(() => Promise.resolve(user)),
      findByEmail: mock(() => Promise.resolve(user)),
      create: mock(() => Promise.resolve(user)),
    };
    service = new UsersService(repository as unknown as UsersRepository);
  });

  it('looks users up by a normalized email', async () => {
    await service.findByEmail('  David@Example.COM ');

    expect(repository.findByEmail).toHaveBeenCalledWith('david@example.com');
  });

  it('stores a normalized email and passes the hash through unchanged', async () => {
    await service.create({
      email: 'David@Example.com',
      passwordHash: '$argon2id$hash',
    });

    expect(repository.create).toHaveBeenCalledWith({
      email: 'david@example.com',
      passwordHash: '$argon2id$hash',
    });
  });

  it('finds users by id', async () => {
    expect(await service.findById(1)).toBe(user);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });
});
