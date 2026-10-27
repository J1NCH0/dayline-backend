import { COMPONENT_STATUS } from '../constants/component-status.constant.js';
import { HEALTH_STATUS } from '../constants/health-status.constant.js';
import type { HealthResponseDto } from '../dto/response/health.response.dto.js';
import type { HealthCheckResult } from '../types/health-check-result.type.js';

export class HealthMapper {
  static toResponse(result: HealthCheckResult): HealthResponseDto {
    return {
      status: result.databaseReachable ? HEALTH_STATUS.OK : HEALTH_STATUS.ERROR,
      database: result.databaseReachable
        ? COMPONENT_STATUS.UP
        : COMPONENT_STATUS.DOWN,
    };
  }
}
