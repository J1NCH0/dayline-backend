import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppConfigModule } from './config/app-config.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ThrottlingModule } from './throttling/throttling.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlingModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
