import type { COMPONENT_STATUS } from '../constants/component-status.constant.js';

export type ComponentStatus =
  (typeof COMPONENT_STATUS)[keyof typeof COMPONENT_STATUS];
