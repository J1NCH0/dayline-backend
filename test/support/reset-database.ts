import type { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/services/prisma.service.js';

export async function resetDatabase(app: INestApplication): Promise<void> {
  await app
    .get(PrismaService)
    .$executeRaw`TRUNCATE TABLE "sessions", "users" RESTART IDENTITY CASCADE`;
}
