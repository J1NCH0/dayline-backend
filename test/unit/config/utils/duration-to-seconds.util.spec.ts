import { describe, expect, it } from 'bun:test';
import { durationToSeconds } from '../../../../src/config/utils/duration-to-seconds.util.js';

describe('durationToSeconds', () => {
  it.each([
    ['900s', 900],
    ['15m', 900],
    ['1h', 3600],
    ['1d', 86400],
  ])('converts %s to %d seconds', (duration, seconds) => {
    expect(durationToSeconds(duration)).toBe(seconds);
  });

  it.each(['15', 'm', '15min', '-5m', ''])('rejects "%s"', (duration) => {
    expect(() => durationToSeconds(duration)).toThrow(/Invalid duration/);
  });
});
