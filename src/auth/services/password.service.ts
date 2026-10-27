import { Injectable } from '@nestjs/common';
import { PASSWORD_HASH_MEMORY_COST_KIB } from '../constants/password-hash-memory-cost-kib.constant.js';
import { PASSWORD_HASH_TIME_COST } from '../constants/password-hash-time-cost.constant.js';
import { TIMING_GUARD_PASSWORD } from '../constants/timing-guard-password.constant.js';

@Injectable()
export class PasswordService {
  private timingGuardHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: 'argon2id',
      memoryCost: PASSWORD_HASH_MEMORY_COST_KIB,
      timeCost: PASSWORD_HASH_TIME_COST,
    });
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return Bun.password.verify(password, passwordHash);
  }

  async verifyAgainstTimingGuard(password: string): Promise<false> {
    this.timingGuardHash ??= this.hash(TIMING_GUARD_PASSWORD);
    await this.verify(password, await this.timingGuardHash);
    return false;
  }
}
