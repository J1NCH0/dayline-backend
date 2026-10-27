import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ThrottlingModule } from './throttling/throttling.module.js';

@Module({
  imports: [AppConfigModule, PrismaModule, ThrottlingModule, HealthModule],
})
export class AppModule {}
