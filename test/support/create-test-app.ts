import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap/configure-app.js';
import type { CreateTestAppOptions } from './types/create-test-app-options.type.js';

export async function createTestApp({
  controllers = [],
  customize = (builder) => builder,
}: CreateTestAppOptions = {}): Promise<NestExpressApplication> {
  const moduleRef = await customize(
    Test.createTestingModule({ imports: [AppModule], controllers }),
  ).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return app;
}
