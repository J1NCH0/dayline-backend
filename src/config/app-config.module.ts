import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './services/app-config.service.js';
import { validateEnv } from './validation/validate-env.validation.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
