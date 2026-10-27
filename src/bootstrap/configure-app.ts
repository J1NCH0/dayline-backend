import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppConfigService } from '../config/services/app-config.service.js';
import { VALIDATION_PIPE_OPTIONS } from './constants/validation-pipe-options.constant.js';

export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
  app.enableShutdownHooks();
}
