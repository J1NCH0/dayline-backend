import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../src/config/services/app-config.service.js';

@Injectable()
export class TrustingProxyConfigService extends AppConfigService {
  override get trustProxy(): number {
    return 1;
  }
}
