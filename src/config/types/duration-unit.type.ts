import type { SECONDS_PER_DURATION_UNIT } from '../constants/seconds-per-duration-unit.constant.js';

export type DurationUnit = keyof typeof SECONDS_PER_DURATION_UNIT;
