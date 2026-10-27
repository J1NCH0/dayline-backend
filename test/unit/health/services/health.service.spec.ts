import { describe, expect, it, mock } from 'bun:test';
import type { HealthRepository } from '../../../../src/health/repositories/health.repository.js';
import { HealthService } from '../../../../src/health/services/health.service.js';

function createService(pingDatabase: () => Promise<void>) {
  const repository = { pingDatabase: mock(pingDatabase) };
  const service = new HealthService(repository as unknown as HealthRepository);
  return { service, repository };
}

describe('HealthService', () => {
  it('reports the database as reachable when the ping succeeds', async () => {
    const { service, repository } = createService(() => Promise.resolve());

    expect(await service.check()).toEqual({ databaseReachable: true });
    expect(repository.pingDatabase).toHaveBeenCalledTimes(1);
  });

  it('reports the database as unreachable when the ping throws', async () => {
    const { service } = createService(() =>
      Promise.reject(new Error('connection refused')),
    );

    expect(await service.check()).toEqual({ databaseReachable: false });
  });
});
