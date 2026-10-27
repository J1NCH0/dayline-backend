import { Injectable } from '@nestjs/common';
import { HealthRepository } from '../repositories/health.repository.js';
import type { HealthCheckResult } from '../types/health-check-result.type.js';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check(): Promise<HealthCheckResult> {
    try {
      await this.healthRepository.pingDatabase();
      return { databaseReachable: true };
    } catch {
      return { databaseReachable: false };
    }
  }
}
