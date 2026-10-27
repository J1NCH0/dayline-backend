import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { PasswordService } from '../../../../src/auth/services/password.service.js';
import { AuthService } from '../../../../src/auth/services/auth.service.js';
import type { User } from '../../../../src/generated/prisma/client.js';
import { FormValidationException } from '../../../../src/http/exceptions/form-validation.exception.js';
import type { UsersService } from '../../../../src/users/services/users.service.js';

const user: User = {
  id: 1,
  email: 'david@example.com',
  passwordHash: '$argon2id$hash',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService.register', () => {
  let usersService: {
    findByEmail: ReturnType<typeof mock>;
    create: ReturnType<typeof mock>;
  };
  let passwordService: { hash: ReturnType<typeof mock> };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve(user)),
    };
    passwordService = { hash: mock(() => Promise.resolve('$argon2id$hash')) };
    service = new AuthService(
      usersService as unknown as UsersService,
      passwordService as unknown as PasswordService,
    );
  });

  it('hashes the password and creates the user with the hash only', async () => {
    const created = await service.register('david@example.com', 'plain password');

    expect(created).toBe(user);
    expect(passwordService.hash).toHaveBeenCalledWith('plain password');
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'david@example.com',
      passwordHash: '$argon2id$hash',
    });
  });

  it('throws a 409 field error when the email is taken, without hashing', async () => {
    usersService.findByEmail.mockImplementation(() => Promise.resolve(user));

    const attempt = service.register('david@example.com', 'plain password');

    expect(attempt).rejects.toBeInstanceOf(FormValidationException);
    await attempt.catch((error: FormValidationException) => {
      expect(error.getStatus()).toBe(409);
      expect(error.fieldErrors).toEqual({
        email: ['Email is already registered'],
      });
    });
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });
});
