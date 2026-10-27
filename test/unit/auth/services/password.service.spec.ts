import { describe, expect, it } from 'bun:test';
import { PasswordService } from '../../../../src/auth/services/password.service.js';

const service = new PasswordService();
const password = 'correct horse battery staple';

describe('PasswordService', () => {
  it('hashes with argon2id, 64 MiB memory and 3 iterations', async () => {
    const hash = await service.hash(password);

    expect(hash).toStartWith('$argon2id$v=19$m=65536,t=3,');
    expect(hash).not.toContain(password);
  });

  it('salts every hash differently', async () => {
    expect(await service.hash(password)).not.toBe(await service.hash(password));
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await service.hash(password);

    expect(await service.verify(password, hash)).toBe(true);
    expect(await service.verify('wrong password here', hash)).toBe(false);
  });

  it('always rejects in the timing guard, even for the guard password itself', async () => {
    expect(await service.verifyAgainstTimingGuard(password)).toBe(false);
    expect(
      await service.verifyAgainstTimingGuard('dayline-timing-guard-password'),
    ).toBe(false);
  });

  it('takes about as long for an unknown user as for a wrong password', async () => {
    const hash = await service.hash(password);
    await service.verifyAgainstTimingGuard(password);

    const time = async (run: () => Promise<boolean>) => {
      const start = performance.now();
      for (let i = 0; i < 5; i++) await run();
      return performance.now() - start;
    };
    const knownUser = await time(() => service.verify('wrong password', hash));
    const unknownUser = await time(() =>
      service.verifyAgainstTimingGuard('wrong password'),
    );

    expect(unknownUser / knownUser).toBeGreaterThan(0.5);
    expect(unknownUser / knownUser).toBeLessThan(2);
  });
});
