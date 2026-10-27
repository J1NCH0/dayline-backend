export const ENV_DEFAULTS = {
  NODE_ENV: 'development',
  PORT: 3000,
  JWT_ACCESS_TTL: '15m',
  REFRESH_TOKEN_TTL_DAYS: 30,
  TRUST_PROXY: 0,
} as const;
