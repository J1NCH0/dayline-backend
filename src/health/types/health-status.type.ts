import type { HEALTH_STATUS } from '../constants/health-status.constant.js';

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];
