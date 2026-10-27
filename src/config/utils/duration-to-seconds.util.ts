import { DURATION_PATTERN } from '../constants/duration-pattern.constant.js';
import { SECONDS_PER_DURATION_UNIT } from '../constants/seconds-per-duration-unit.constant.js';
import type { DurationUnit } from '../types/duration-unit.type.js';

export function durationToSeconds(duration: string): number {
  if (!DURATION_PATTERN.test(duration)) {
    throw new Error(`Invalid duration: "${duration}"`);
  }
  const unit = duration.at(-1) as DurationUnit;
  return Number(duration.slice(0, -1)) * SECONDS_PER_DURATION_UNIT[unit];
}
