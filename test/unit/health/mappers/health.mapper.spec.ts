import { describe, expect, it } from 'bun:test';
import { HealthMapper } from '../../../../src/health/mappers/health.mapper.js';

describe('HealthMapper.toResponse', () => {
  it('maps a reachable database to ok / up', () => {
    expect(HealthMapper.toResponse({ databaseReachable: true })).toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('maps an unreachable database to error / down', () => {
    expect(HealthMapper.toResponse({ databaseReachable: false })).toEqual({
      status: 'error',
      database: 'down',
    });
  });
});
