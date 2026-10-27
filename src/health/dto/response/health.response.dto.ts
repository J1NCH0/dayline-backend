import type { ComponentStatus } from '../../types/component-status.type.js';
import type { HealthStatus } from '../../types/health-status.type.js';

export class HealthResponseDto {
  status: HealthStatus;
  database: ComponentStatus;
}
