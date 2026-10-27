import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DATABASE_UNAVAILABLE_MESSAGE } from '../constants/database-unavailable-message.constant.js';
import type { HealthResponseDto } from '../dto/response/health.response.dto.js';
import { HealthMapper } from '../mappers/health.mapper.js';
import { HealthService } from '../services/health.service.js';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check(): Promise<HealthResponseDto> {
    const result = await this.healthService.check();

    if (!result.databaseReachable) {
      throw new ServiceUnavailableException(DATABASE_UNAVAILABLE_MESSAGE);
    }

    return HealthMapper.toResponse(result);
  }
}
