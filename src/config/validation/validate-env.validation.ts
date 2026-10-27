import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './environment-variables.validation.js';

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .map((message) => `  - ${message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return env;
}
