import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DEFAULT_THROTTLE_LIMIT } from './constants/default-throttle-limit.constant.js';
import { DEFAULT_THROTTLE_TTL_MS } from './constants/default-throttle-ttl-ms.constant.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: DEFAULT_THROTTLE_TTL_MS, limit: DEFAULT_THROTTLE_LIMIT },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class ThrottlingModule {}
