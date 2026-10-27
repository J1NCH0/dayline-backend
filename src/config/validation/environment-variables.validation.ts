import { IsIn, IsInt, IsString, Matches, Max, Min, MinLength } from 'class-validator';
import { DURATION_PATTERN } from '../constants/duration-pattern.constant.js';
import { ENV_DEFAULTS } from '../constants/env-defaults.constant.js';
import { JWT_ACCESS_SECRET_MIN_LENGTH } from '../constants/jwt-access-secret-min-length.constant.js';
import { NODE_ENVS } from '../constants/node-envs.constant.js';
import { POSTGRES_URL_PATTERN } from '../constants/postgres-url-pattern.constant.js';
import type { NodeEnv } from '../types/node-env.type.js';

export class EnvironmentVariables {
  @IsIn(NODE_ENVS)
  NODE_ENV: NodeEnv = ENV_DEFAULTS.NODE_ENV;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = ENV_DEFAULTS.PORT;

  @Matches(POSTGRES_URL_PATTERN, {
    message: 'DATABASE_URL must be a postgres:// or postgresql:// URL',
  })
  DATABASE_URL: string;

  @IsString()
  @MinLength(JWT_ACCESS_SECRET_MIN_LENGTH, {
    message: `JWT_ACCESS_SECRET must be at least ${JWT_ACCESS_SECRET_MIN_LENGTH} characters`,
  })
  JWT_ACCESS_SECRET: string;

  @Matches(DURATION_PATTERN, {
    message: 'JWT_ACCESS_TTL must look like 900s, 15m, 1h or 1d',
  })
  JWT_ACCESS_TTL: string = ENV_DEFAULTS.JWT_ACCESS_TTL;

  @IsInt()
  @Min(1)
  @Max(365)
  REFRESH_TOKEN_TTL_DAYS: number = ENV_DEFAULTS.REFRESH_TOKEN_TTL_DAYS;

  @IsInt()
  @Min(0)
  TRUST_PROXY: number = ENV_DEFAULTS.TRUST_PROXY;
}
