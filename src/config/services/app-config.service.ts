import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NodeEnv } from '../types/node-env.type.js';
import { durationToSeconds } from '../utils/duration-to-seconds.util.js';
import type { EnvironmentVariables } from '../validation/environment-variables.validation.js';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv(): NodeEnv {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get jwtAccessSecret(): string {
    return this.config.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get accessTokenTtlSeconds(): number {
    return durationToSeconds(this.config.get('JWT_ACCESS_TTL', { infer: true }));
  }

  get refreshTokenTtlDays(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
  }

  get trustProxy(): number {
    return this.config.get('TRUST_PROXY', { infer: true });
  }
}
